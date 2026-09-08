"""Add engine_status JSONB column to reports

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("reports", sa.Column("engine_status", JSONB, nullable=True))


def downgrade():
    op.drop_column("reports", "engine_status")