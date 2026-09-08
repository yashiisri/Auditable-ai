"""Add taf_applicable_categories to taf_assessments and ai_systems

Stores the user-selected TAF risk category scope from the registration
wizard. GAI is always included by the application; this column holds the
full resolved set (e.g. ["GAI", "DM", "PD"]) so it can be queried and
displayed without re-deriving from the registration_profile JSONB each time.

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-07
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade():
    # taf_assessments: store the resolved applicable_categories list
    op.add_column(
        "taf_assessments",
        sa.Column("applicable_categories", JSONB, nullable=True),
    )

    # ai_systems: add a top-level column for quick querying without digging
    # into registration_profile JSONB.  Nullable — filled for new registrations;
    # legacy rows will have NULL (treated as ["GAI"] by the application).
    op.add_column(
        "ai_systems",
        sa.Column("taf_applicable_categories", JSONB, nullable=True),
    )


def downgrade():
    op.drop_column("taf_assessments", "applicable_categories")
    op.drop_column("ai_systems", "taf_applicable_categories")