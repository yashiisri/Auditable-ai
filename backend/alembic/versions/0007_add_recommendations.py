"""Add AI-generated recommendation fields to reports and report_recommended_actions table

reports table gets four new columns:
  overall_narrative TEXT          — Groq-generated 3-4 sentence narrative specific to this system
  deployment_verdict_context TEXT — one sentence explaining why Ready/Conditional/Requires Remediation
  recs_generated BOOLEAN          — False when Groq was unavailable (frontend shows re-run banner)
  recommended_actions JSONB       — denormalized flat list for fast read (redundant with table below)

New table: report_recommended_actions
  Normalized rows: one per action, with principle, effort, impact, day_target, phase, owner_team.
  day_target is an integer (1-90+) set by Groq and clamped to the governance phase band.
  phase: 0=Immediate (0-30d), 1=Short-term (31-60d), 2=Ongoing (61-90d+).

Revision ID: 0007
Revises: 0006
Create Date: 2026-09-08
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision      = "0007"
down_revision = "0006"
branch_labels = None
depends_on    = None


def upgrade():
    # ── reports: new recommendation columns ──────────────────────────────────
    op.add_column("reports", sa.Column("overall_narrative",          sa.Text,    nullable=True))
    op.add_column("reports", sa.Column("deployment_verdict_context", sa.Text,    nullable=True))
    op.add_column("reports", sa.Column("recs_generated",             sa.Boolean, nullable=True))
    op.add_column("reports", sa.Column("recommended_actions",        JSONB,      nullable=True))

    # ── report_recommended_actions: normalized action table ───────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS report_recommended_actions (
            id          UUID DEFAULT gen_random_uuid() NOT NULL,
            report_id   UUID NOT NULL,
            ai_system_id UUID,
            owner_id    UUID NOT NULL,
            principle   VARCHAR(100) NOT NULL,
            action_text TEXT,
            effort      VARCHAR(20),
            impact      VARCHAR(30),
            day_target  INTEGER,
            phase       INTEGER,
            owner_team  VARCHAR(200),
            sort_order  INTEGER DEFAULT 0,
            created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
            PRIMARY KEY (id)
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_rec_actions_report
        ON report_recommended_actions (report_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_rec_actions_ai_system
        ON report_recommended_actions (ai_system_id)
    """)


def downgrade():
    op.execute("DROP TABLE IF EXISTS report_recommended_actions")
    op.drop_column("reports", "recommended_actions")
    op.drop_column("reports", "recs_generated")
    op.drop_column("reports", "deployment_verdict_context")
    op.drop_column("reports", "overall_narrative")