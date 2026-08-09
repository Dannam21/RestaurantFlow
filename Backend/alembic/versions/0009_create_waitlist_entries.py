"""Create waitlist_entries table.

Revision ID: 0009
Revises: 0008
Create Date: 2026-08-08
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "waitlist_entries",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=True),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=True),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("party_size", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("quoted_wait_minutes", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("table_id", sa.Integer(), nullable=True),
        sa.Column("notified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("seated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["table_id"], ["tables.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_waitlist_entries_status", "waitlist_entries", ["status"], unique=False
    )
    op.create_index(
        "ix_waitlist_entries_created_at",
        "waitlist_entries",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        "ix_waitlist_entries_customer_id",
        "waitlist_entries",
        ["customer_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_waitlist_entries_customer_id", table_name="waitlist_entries")
    op.drop_index("ix_waitlist_entries_created_at", table_name="waitlist_entries")
    op.drop_index("ix_waitlist_entries_status", table_name="waitlist_entries")
    op.drop_table("waitlist_entries")
