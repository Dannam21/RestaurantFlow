"""Add capacity column to tables.

Revision ID: 0010
Revises: 0009
Create Date: 2026-08-08
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tables",
        sa.Column(
            "capacity", sa.Integer(), nullable=False, server_default="4"
        ),
    )
    op.alter_column("tables", "capacity", server_default=None)


def downgrade() -> None:
    op.drop_column("tables", "capacity")
