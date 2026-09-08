"""Create audit_evidence table — unified per-control evidence store

Every audit channel (blackbox probes, SDCC sub-parameter metrics,
profile completeness) writes one row per TAF control here, keyed by
(audit_id, control_id). The taxonomy mapper reads from this single
table instead of stitching three different result shapes together with
a fallback chain.

When multiple channels produce evidence for the same control (e.g. a
blackbox probe AND a corroborating sub-parameter metric), the reader
picks the higher-confidence one as primary and attaches the rest as
corroboration.

Revision ID: 0005
Revises: 0004
Create Date: 2026-09-08
"""
from alembic import op

revision      = "0005"
down_revision = "0004"
branch_labels = None
depends_on    = None


def upgrade():
    # Use raw SQL with IF NOT EXISTS so this is safe to run even if the table
    # was created manually or by a previous partial migration run.
    op.execute("""
        CREATE TABLE IF NOT EXISTS audit_evidence (
            id           UUID DEFAULT gen_random_uuid() NOT NULL,
            audit_id     VARCHAR(200) NOT NULL,
            ai_name      VARCHAR(300) NOT NULL,
            owner_id     UUID NOT NULL,
            control_id   VARCHAR(30)  NOT NULL,
            pillar       VARCHAR(40),
            category     VARCHAR(10),
            channel      VARCHAR(20),
            evidence_type VARCHAR(30),
            value        FLOAT,
            confidence   VARCHAR(10),
            source       VARCHAR(120),
            detail       TEXT,
            probes       JSONB,
            created_at   TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
            PRIMARY KEY (id)
        )
    """)
    # Indexes — also safe to re-run
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_evidence_lookup
        ON audit_evidence (ai_name, owner_id, control_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_evidence_audit
        ON audit_evidence (audit_id)
    """)


def downgrade():
    op.drop_index("ix_evidence_audit",  table_name="audit_evidence")
    op.drop_index("ix_evidence_lookup", table_name="audit_evidence")
    op.drop_table("audit_evidence")