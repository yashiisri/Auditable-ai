"""Initial PostgreSQL 17 schema

Revision ID: 0001
Revises:
Create Date: 2026-08-31
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id",          UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name",        sa.String(200),  nullable=False),
        sa.Column("email",       sa.String(320),  nullable=False, unique=True),
        sa.Column("password",    sa.Text,         nullable=False),
        sa.Column("role",        sa.String(50),   nullable=False, server_default="auditor"),
        sa.Column("is_active",   sa.Boolean,      nullable=False, server_default="true"),
        sa.Column("audit_count", sa.Integer,      nullable=False, server_default="0"),
        sa.Column("created_at",  sa.DateTime,     nullable=False, server_default=sa.text("now()")),
        sa.Column("last_login",  sa.DateTime,     nullable=True),
        sa.Column("extra",       JSONB,            nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "ai_systems",
        sa.Column("id",                   UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name",                 sa.String(300),  nullable=False),
        sa.Column("description",          sa.Text,         nullable=False, server_default=""),
        sa.Column("domain",               sa.String(200),  nullable=False, server_default=""),
        sa.Column("connector",            JSONB,           nullable=True),
        sa.Column("owner_id",             UUID(as_uuid=True), nullable=False),
        sa.Column("status",               sa.String(50),   nullable=False, server_default="active"),
        sa.Column("audit_runs",           sa.Integer,      nullable=False, server_default="0"),
        sa.Column("system_prompt",        sa.Text,         nullable=True),
        sa.Column("registration_profile", JSONB,           nullable=True),
        sa.Column("created_at",           sa.DateTime,     nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at",           sa.DateTime,     nullable=True),
    )
    op.create_index("ix_ai_systems_owner",      "ai_systems", ["owner_id"])
    op.create_index("ix_ai_systems_name_owner", "ai_systems", ["name", "owner_id"])

    op.create_table(
        "sdcc_results",
        sa.Column("id",                 UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("ai_name",            sa.String(300),  nullable=False),
        sa.Column("owner_id",           UUID(as_uuid=True), nullable=False),
        sa.Column("model_type",         sa.String(100),  nullable=True),
        sa.Column("logs_ingested",      sa.Integer,      nullable=False, server_default="0"),
        sa.Column("data_quality_score", sa.Float,        nullable=True),
        sa.Column("sample_records",     JSONB,           nullable=True),
        sa.Column("kb_chunks",          JSONB,           nullable=True),
        sa.Column("diagnostics",        JSONB,           nullable=True),
        sa.Column("column_warnings",    JSONB,           nullable=True),
        sa.Column("recommendation",     sa.Text,         nullable=True),
        sa.Column("structural_risk",    JSONB,           nullable=True),
        sa.Column("det_conf",           sa.Float,        nullable=True),
        sa.Column("extra",              JSONB,           nullable=True),
        sa.Column("created_at",         sa.DateTime,     nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at",         sa.DateTime,     nullable=True),
    )
    op.create_index("ix_sdcc_ai_owner", "sdcc_results", ["ai_name", "owner_id"])

    op.create_table(
        "reports",
        sa.Column("id",                      UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("report_id",               sa.String(200),  nullable=False, unique=True),
        sa.Column("ai_name",                 sa.String(300),  nullable=False),
        sa.Column("model_type",              sa.String(100),  nullable=True),
        sa.Column("model_label",             sa.String(200),  nullable=True),
        sa.Column("detection_confidence",    sa.Float,        nullable=True),
        sa.Column("evaluated_at",            sa.Text,         nullable=True),
        sa.Column("overall_score",           sa.Float,        nullable=True),
        sa.Column("risk_level",              sa.String(50),   nullable=True),
        sa.Column("structural_risk",         JSONB,           nullable=True),
        sa.Column("logs_evaluated",          sa.Integer,      nullable=True),
        sa.Column("data_quality_score",      sa.Float,        nullable=True),
        sa.Column("trusted_ai_principles",   JSONB,           nullable=True),
        sa.Column("diagnostics",             JSONB,           nullable=True),
        sa.Column("model_metrics",           JSONB,           nullable=True),
        sa.Column("computation_notes",       JSONB,           nullable=True),
        sa.Column("code_build_risk",         JSONB,           nullable=True),
        sa.Column("llm_judge",               JSONB,           nullable=True),
        sa.Column("audit_sources",           JSONB,           nullable=True),
        sa.Column("findings",                JSONB,           nullable=True),
        sa.Column("risk_analysis",           JSONB,           nullable=True),
        sa.Column("recommendation",          sa.Text,         nullable=True),
        sa.Column("framework_compliance",    JSONB,           nullable=True),
        sa.Column("column_warnings",         JSONB,           nullable=True),
        sa.Column("owner_id",                UUID(as_uuid=True), nullable=False),
        sa.Column("created_at",              sa.DateTime,     nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_reports_owner",   "reports", ["owner_id"])
    op.create_index("ix_reports_ai_name", "reports", ["ai_name"])

    op.create_table(
        "report_audit_results",
        sa.Column("id",          UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("audit_id",    sa.String(200),  nullable=False, unique=True),
        sa.Column("owner_id",    UUID(as_uuid=True), nullable=True),
        sa.Column("filename",    sa.String(500),  nullable=True),
        sa.Column("file_hash",   sa.String(200),  nullable=True),
        sa.Column("source_type", sa.String(50),   nullable=True),
        sa.Column("result",      JSONB,            nullable=True),
        sa.Column("created_at",  sa.DateTime,     nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "blackbox_audits",
        sa.Column("id",              UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("audit_id",        sa.String(200),  nullable=False, unique=True),
        sa.Column("ai_name",         sa.String(300),  nullable=False),
        sa.Column("owner_id",        UUID(as_uuid=True), nullable=False),
        sa.Column("mode",            sa.String(50),   nullable=True),
        sa.Column("status",          sa.String(50),   nullable=True),
        sa.Column("probe_results",   JSONB,           nullable=True),
        sa.Column("fingerprint",     JSONB,           nullable=True),
        sa.Column("code_build_risk", JSONB,           nullable=True),
        sa.Column("adaptive_meta",   JSONB,           nullable=True),
        sa.Column("summary",         JSONB,           nullable=True),
        sa.Column("extra",           JSONB,           nullable=True),
        sa.Column("started_at",      sa.DateTime,     nullable=True),
        sa.Column("completed_at",    sa.DateTime,     nullable=True),
        sa.Column("created_at",      sa.DateTime,     nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_blackbox_ai_owner", "blackbox_audits", ["ai_name", "owner_id"])

    op.create_table(
        "probe_logs",
        sa.Column("id",         UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("audit_id",   sa.String(200),  nullable=False),
        sa.Column("ai_name",    sa.String(300),  nullable=False),
        sa.Column("log_type",   sa.String(50),   nullable=False, server_default="probe"),
        sa.Column("mode",       sa.String(50),   nullable=True),
        sa.Column("task_id",    sa.String(300),  nullable=True),
        sa.Column("dimension",  sa.String(200),  nullable=True),
        sa.Column("input",      sa.Text,         nullable=True),
        sa.Column("output",     sa.Text,         nullable=True),
        sa.Column("latency_ms", sa.Float,        nullable=True),
        sa.Column("extra",      JSONB,           nullable=True),
        sa.Column("created_at", sa.DateTime,     nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_probe_logs_audit", "probe_logs", ["audit_id"])
    op.create_index("ix_probe_logs_ai",    "probe_logs", ["ai_name"])


    op.create_table(
        "taf_assessments",
        sa.Column("id",               UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("audit_id",         sa.String(200),  nullable=False),
        sa.Column("ai_name",          sa.String(300),  nullable=False),
        sa.Column("owner_id",         UUID(as_uuid=True), nullable=False),
        sa.Column("ai_category",      sa.String(10),   nullable=True),
        sa.Column("rows",             JSONB,            nullable=True),
        sa.Column("summary",          JSONB,            nullable=True),
        sa.Column("has_training_data",sa.Boolean,      nullable=False, server_default="false"),
        sa.Column("training_data_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at",       sa.DateTime,     nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at",       sa.DateTime,     nullable=True),
    )
    op.create_index("ix_taf_audit_id", "taf_assessments", ["audit_id"])
    op.create_index("ix_taf_ai_owner", "taf_assessments", ["ai_name", "owner_id"])

    op.create_table(
        "training_data_uploads",
        sa.Column("id",              UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("ai_name",         sa.String(300),  nullable=False),
        sa.Column("owner_id",        UUID(as_uuid=True), nullable=False),
        sa.Column("filename",        sa.String(500),  nullable=True),
        sa.Column("file_hash",       sa.String(200),  nullable=True),
        sa.Column("file_size_bytes", sa.Integer,      nullable=True),
        sa.Column("upload_type",     sa.String(50),   nullable=True),
        sa.Column("row_count",       sa.Integer,      nullable=True),
        sa.Column("analysis",        JSONB,            nullable=True),
        sa.Column("column_names",    JSONB,            nullable=True),
        sa.Column("sample_rows",     JSONB,            nullable=True),
        sa.Column("status",          sa.String(50),   nullable=False, server_default="pending"),
        sa.Column("created_at",      sa.DateTime,     nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_train_ai_owner", "training_data_uploads", ["ai_name", "owner_id"])


def downgrade():
    for tbl in ["training_data_uploads", "taf_assessments", "probe_logs", "blackbox_audits", "report_audit_results", "reports",
                "sdcc_results", "ai_systems", "users"]:
        op.drop_table(tbl)
