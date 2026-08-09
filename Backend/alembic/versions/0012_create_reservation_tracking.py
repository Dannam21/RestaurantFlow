"""Create reservation tracking table.

Revision ID: 0012
Revises: 0011
Create Date: 2026-08-08
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0012"
down_revision: str | None = "0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "reservation_tracking",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("table_id", sa.Integer(), nullable=False),
        sa.Column("party_size", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("reserved_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["table_id"], ["tables.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_reservation_tracking_customer_id",
        "reservation_tracking",
        ["customer_id"],
    )
    op.create_index(
        "ix_reservation_tracking_table_id",
        "reservation_tracking",
        ["table_id"],
    )
    op.create_index(
        "ix_reservation_tracking_reserved_at",
        "reservation_tracking",
        ["reserved_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_reservation_tracking_reserved_at", table_name="reservation_tracking")
    op.drop_index("ix_reservation_tracking_table_id", table_name="reservation_tracking")
    op.drop_index(
        "ix_reservation_tracking_customer_id", table_name="reservation_tracking"
    )
    op.drop_table("reservation_tracking")
