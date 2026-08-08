"""Add base estimated duration to orders.

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-08
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "orders", sa.Column("estimated_duration", sa.Integer(), nullable=True)
    )
    op.execute(
        sa.text(
            "UPDATE orders SET estimated_duration = estimated_time "
            "WHERE estimated_time IS NOT NULL"
        )
    )


def downgrade() -> None:
    op.drop_column("orders", "estimated_duration")
