"""Add ai_system_id FK across tables (backfilled) and normalize reports storage

This migration does two things:

1. Adds an `ai_system_id` UUID column to every table that previously only
   identified an AI system by a free-text (ai_name, owner_id) pair:
   sdcc_results, reports, blackbox_audits, probe_logs, taf_assessments,
   training_data_uploads, report_audit_results. Each column is backfilled
   from ai_systems by matching name + owner_id, so existing rows don't lose
   their association. The column is left nullable — a handful of legacy rows
   may not match cleanly (e.g. an AI system that was since renamed or
   deleted) and those are left NULL rather than guessed at.

2. Creates the new normalized report tables (report_principle_scores,
   report_sub_parameters, report_findings, report_framework_compliance,
   report_framework_principle_scores, report_model_metrics,
   report_taxonomy_controls, llm_judge_row_verdicts, llm_judge_votes,
   knowledge_base_chunks) plus the typed log tables (uploaded_logs,
   probe_run_logs, chat_logs).

   NOTE: app/database.py's init_db() already calls metadata.create_all()
   on startup, which will also create any of these tables if the app starts
   before this migration runs. create_table() below uses checkfirst so it
   is a no-op in that case rather than erroring.

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-07
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


# Tables that get a new ai_system_id column, and the (name_col, owner_col)
# pair to backfill it from against ai_systems(name, owner_id, id).
# Tables that get a new ai_system_id column, and the (name_col, owner_col)
# pair to backfill it from against ai_systems(name, owner_id, id).
# probe_logs is handled separately below — it has no owner_id column at all
# (rows were only ever scoped by ai_name), so it needs a different strategy.
_BACKFILL_TARGETS = [
    ("sdcc_results",          "ai_name", "owner_id"),
    ("reports",               "ai_name", "owner_id"),
    ("blackbox_audits",       "ai_name", "owner_id"),
    ("taf_assessments",       "ai_name", "owner_id"),
    ("training_data_uploads", "ai_name", "owner_id"),
]


def upgrade():
    conn = op.get_bind()

    # ── 1. Add + backfill ai_system_id on tables keyed by (ai_name, owner_id) ──
    for table, name_col, owner_col in _BACKFILL_TARGETS:
        op.add_column(table, sa.Column("ai_system_id", UUID(as_uuid=True), nullable=True))
        conn.execute(sa.text(f"""
            UPDATE {table} t
            SET ai_system_id = a.id
            FROM ai_systems a
            WHERE t.{name_col} = a.name
              AND t.{owner_col} = a.owner_id
              AND t.ai_system_id IS NULL
        """))
        conn.execute(sa.text(f'CREATE INDEX IF NOT EXISTS ix_{table}_ai_system ON {table} (ai_system_id)'))

    # ── 1b. probe_logs — no owner_id column exists on this table. Some rows
    # (uploaded_log type, written by log_normaliser.py) carry owner_id inside
    # the extra JSONB blob instead; everything else (probe/fingerprint/rerun
    # rows) never recorded an owner at all. Backfill in two passes:
    #   pass 1: match via extra->>'owner_id' where present (unambiguous)
    #   pass 2: for whatever's left, match by ai_name alone, but ONLY when
    #           exactly one ai_system anywhere has that name — if two
    #           different owners each have an AI system called the same
    #           thing, guessing which one a legacy row belongs to would be
    #           actively wrong, so those are left NULL rather than guessed.
    op.add_column("probe_logs", sa.Column("ai_system_id", UUID(as_uuid=True), nullable=True))

    conn.execute(sa.text("""
        UPDATE probe_logs t
        SET ai_system_id = a.id
        FROM ai_systems a
        WHERE t.ai_name = a.name
          AND t.extra ->> 'owner_id' = a.owner_id::text
          AND t.ai_system_id IS NULL
    """))

    conn.execute(sa.text("""
        UPDATE probe_logs t
        SET ai_system_id = sub.id
        FROM (
            SELECT name, MIN(id::text)::uuid AS id
            FROM ai_systems
            GROUP BY name
            HAVING COUNT(*) = 1
        ) sub
        WHERE t.ai_name = sub.name
          AND t.ai_system_id IS NULL
    """))

    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_probe_logs_ai_system ON probe_logs (ai_system_id)"
    ))

    # report_audit_results has no owner_id guaranteed on every row (nullable),
    # and no ai_name column at all — it's keyed by filename/audit_id instead —
    # so it can't be backfilled the same way. Add the column now; it gets
    # populated going forward wherever the caller already knows which AI
    # system a PDF/self-attestation audit belongs to.
    op.add_column("report_audit_results", sa.Column("ai_system_id", UUID(as_uuid=True), nullable=True))
    conn.execute(sa.text(
        "CREATE INDEX IF NOT EXISTS ix_report_audit_results_ai_system ON report_audit_results (ai_system_id)"
    ))

    # ── 2. New normalized tables (no-op if metadata.create_all() beat us to it) ──
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = set(inspector.get_table_names())

    def _create(name, *columns):
        if name in existing:
            return
        op.create_table(name, *columns)

    _create(
        "uploaded_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("ai_system_id", UUID(as_uuid=True), nullable=True),
        sa.Column("ai_name", sa.String(300), nullable=False),
        sa.Column("owner_id", UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", sa.String(300), nullable=True),
        sa.Column("input", sa.Text, nullable=True),
        sa.Column("output", sa.Text, nullable=True),
        sa.Column("latency_ms", sa.Float, nullable=True),
        sa.Column("extra", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    _create(
        "probe_run_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("ai_system_id", UUID(as_uuid=True), nullable=True),
        sa.Column("ai_name", sa.String(300), nullable=False),
        sa.Column("owner_id", UUID(as_uuid=True), nullable=True),
        sa.Column("audit_id", sa.String(200), nullable=False),
        sa.Column("log_type", sa.String(50), nullable=False),
        sa.Column("mode", sa.String(50), nullable=True),
        sa.Column("task_id", sa.String(300), nullable=True),
        sa.Column("dimension", sa.String(200), nullable=True),
        sa.Column("input", sa.Text, nullable=True),
        sa.Column("output", sa.Text, nullable=True),
        sa.Column("latency_ms", sa.Float, nullable=True),
        sa.Column("extra", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    _create(
        "chat_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("ai_system_id", UUID(as_uuid=True), nullable=True),
        sa.Column("ai_name", sa.String(300), nullable=True),
        sa.Column("owner_id", UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", sa.String(300), nullable=True),
        sa.Column("role", sa.String(20), nullable=True),
        sa.Column("message", sa.Text, nullable=True),
        sa.Column("latency_ms", sa.Float, nullable=True),
        sa.Column("extra", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    _create(
        "report_principle_scores",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("report_id", UUID(as_uuid=True), nullable=False),
        sa.Column("ai_system_id", UUID(as_uuid=True), nullable=True),
        sa.Column("owner_id", UUID(as_uuid=True), nullable=False),
        sa.Column("principle", sa.String(100), nullable=False),
        sa.Column("score", sa.Float, nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    _create(
        "report_sub_parameters",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("report_id", UUID(as_uuid=True), nullable=False),
        sa.Column("ai_system_id", UUID(as_uuid=True), nullable=True),
        sa.Column("owner_id", UUID(as_uuid=True), nullable=False),
        sa.Column("principle", sa.String(100), nullable=False),
        sa.Column("sub_parameter", sa.String(200), nullable=False),
        sa.Column("score", sa.Float, nullable=True),
        sa.Column("definition", sa.Text, nullable=True),
        sa.Column("engine", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    _create(
        "report_findings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("report_id", UUID(as_uuid=True), nullable=False),
        sa.Column("ai_system_id", UUID(as_uuid=True), nullable=True),
        sa.Column("owner_id", UUID(as_uuid=True), nullable=False),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("severity", sa.String(50), nullable=True),
        sa.Column("issue", sa.Text, nullable=True),
        sa.Column("recommendation", sa.Text, nullable=True),
        sa.Column("finding_type", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    _create(
        "report_framework_compliance",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("report_id", UUID(as_uuid=True), nullable=False),
        sa.Column("ai_system_id", UUID(as_uuid=True), nullable=True),
        sa.Column("owner_id", UUID(as_uuid=True), nullable=False),
        sa.Column("framework", sa.String(50), nullable=False),
        sa.Column("status", sa.String(50), nullable=True),
        sa.Column("overall_score", sa.Float, nullable=True),
        sa.Column("threshold", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    _create(
        "report_framework_principle_scores",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("framework_compliance_id", UUID(as_uuid=True), nullable=False),
        sa.Column("principle", sa.String(100), nullable=False),
        sa.Column("score", sa.Float, nullable=True),
    )

    _create(
        "report_model_metrics",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("report_id", UUID(as_uuid=True), nullable=False),
        sa.Column("ai_system_id", UUID(as_uuid=True), nullable=True),
        sa.Column("owner_id", UUID(as_uuid=True), nullable=False),
        sa.Column("metric_key", sa.String(100), nullable=False),
        sa.Column("value", sa.Float, nullable=True),
        sa.Column("risk_level", sa.String(50), nullable=True),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("threshold_low", sa.Float, nullable=True),
        sa.Column("threshold_moderate", sa.Float, nullable=True),
        sa.Column("higher_is_better", sa.Boolean, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    _create(
        "report_taxonomy_controls",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("audit_id", sa.String(200), nullable=False),
        sa.Column("report_id", UUID(as_uuid=True), nullable=True),
        sa.Column("ai_system_id", UUID(as_uuid=True), nullable=True),
        sa.Column("owner_id", UUID(as_uuid=True), nullable=False),
        sa.Column("numbered_id", sa.String(50), nullable=False),
        sa.Column("category", sa.String(10), nullable=True),
        sa.Column("category_full", sa.String(100), nullable=True),
        sa.Column("pillar", sa.String(100), nullable=True),
        sa.Column("risk_description", sa.Text, nullable=True),
        sa.Column("test_description", sa.Text, nullable=True),
        sa.Column("base_mapped", sa.String(20), nullable=True),
        sa.Column("computed_status", sa.String(30), nullable=True),
        sa.Column("evidence", sa.Text, nullable=True),
        sa.Column("score", sa.Float, nullable=True),
        sa.Column("score_source", sa.Text, nullable=True),
        sa.Column("training_gated", sa.Boolean, nullable=True),
        sa.Column("evidence_chain", sa.Text, nullable=True),
        sa.Column("data_required", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    _create(
        "llm_judge_row_verdicts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("report_id", UUID(as_uuid=True), nullable=False),
        sa.Column("ai_system_id", UUID(as_uuid=True), nullable=True),
        sa.Column("owner_id", UUID(as_uuid=True), nullable=False),
        sa.Column("row_index", sa.Integer, nullable=True),
        sa.Column("task_id", sa.String(300), nullable=True),
        sa.Column("input", sa.Text, nullable=True),
        sa.Column("output", sa.Text, nullable=True),
        sa.Column("final_correct", sa.Boolean, nullable=True),
        sa.Column("confidence", sa.String(20), nullable=True),
        sa.Column("disputed", sa.Boolean, nullable=True),
        sa.Column("kb_used", sa.Boolean, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    _create(
        "llm_judge_votes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("row_verdict_id", UUID(as_uuid=True), nullable=False),
        sa.Column("judge_name", sa.String(100), nullable=False),
        sa.Column("vote", sa.Boolean, nullable=True),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column("latency_ms", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )

    _create(
        "knowledge_base_chunks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("ai_system_id", UUID(as_uuid=True), nullable=True),
        sa.Column("ai_name", sa.String(300), nullable=False),
        sa.Column("owner_id", UUID(as_uuid=True), nullable=False),
        sa.Column("chunk_index", sa.Integer, nullable=True),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("source", sa.String(300), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )


def downgrade():
    for table, name_col, owner_col in _BACKFILL_TARGETS:
        op.drop_column(table, "ai_system_id")
    op.drop_column("probe_logs", "ai_system_id")
    op.drop_column("report_audit_results", "ai_system_id")

    for name in [
        "llm_judge_votes", "llm_judge_row_verdicts", "knowledge_base_chunks",
        "report_taxonomy_controls", "report_model_metrics",
        "report_framework_principle_scores", "report_framework_compliance",
        "report_findings", "report_sub_parameters", "report_principle_scores",
        "chat_logs", "probe_run_logs", "uploaded_logs",
    ]:
        op.drop_table(name)