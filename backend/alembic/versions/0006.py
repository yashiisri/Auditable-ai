"""Add columns required by the unified taxonomy-seeded audit pipeline

blackbox_audits
  tier VARCHAR(20)
      Effort tier selected by the user: "dev" | "standard" | "thorough".
      Previously not stored at all — the frontend had to guess from probe count.
      Indexed for filtering (e.g. "show only thorough audits").

  total_probes_expected INTEGER
      Computed at audit start from audit_plan.expected_probe_count() and
      written into the result dict by unified_pipeline.py. The progress
      endpoint reads this column directly instead of digging into the
      extra JSONB blob, which is why the progress bar was stuck at the
      hardcoded 83-probe legacy default for all unified-pipeline audits.

taf_assessments
  pillar_breakdown JSONB
      {pillar: {avg_score, covered, partial, not_covered}} — previously
      computed on every read inside compute_taf_mapping(). Now persisted
      so the TAF taxonomy page fetches it directly without re-running the
      aggregation. Nullable; legacy rows simply don't have it and the
      mapper recomputes on the fly as before.

NOTE: applicable_categories on taf_assessments and taf_applicable_categories
on ai_systems were already added by migration 0004. This migration does NOT
touch those columns again.

Revision ID: 0006
Revises: 0005
Create Date: 2026-09-08
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision      = "0006"
down_revision = "0005"
branch_labels = None
depends_on    = None


def upgrade():
    # ── blackbox_audits ───────────────────────────────────────────────────
    op.add_column(
        "blackbox_audits",
        sa.Column("tier", sa.String(20), nullable=True),
    )
    op.add_column(
        "blackbox_audits",
        sa.Column("total_probes_expected", sa.Integer, nullable=True),
    )
    op.create_index(
        "ix_blackbox_tier",
        "blackbox_audits",
        ["tier"],
    )

    # ── taf_assessments ───────────────────────────────────────────────────
    op.add_column(
        "taf_assessments",
        sa.Column("pillar_breakdown", JSONB, nullable=True),
    )


def downgrade():
    op.drop_column("taf_assessments", "pillar_breakdown")
    op.drop_index("ix_blackbox_tier", table_name="blackbox_audits")
    op.drop_column("blackbox_audits", "total_probes_expected")
    op.drop_column("blackbox_audits", "tier")