"""Create service_sessions table.

Revision ID: 0013
Revises: 0012
Create Date: 2026-08-08
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0013"
down_revision: str | None = "0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "service_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("table_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=True),
        sa.Column("waiter_id", sa.Uuid(), nullable=True),
        sa.Column("order_id", sa.Uuid(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("seated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("waiter_assigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("order_sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["table_id"], ["tables.id"]),
        sa.ForeignKeyConstraint(["waiter_id"], ["staff_users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_service_sessions_customer_id", "service_sessions", ["customer_id"]
    )
    op.create_index("ix_service_sessions_status", "service_sessions", ["status"])
    op.create_index("ix_service_sessions_table_id", "service_sessions", ["table_id"])
    op.create_index(
        "ix_service_sessions_waiter_id", "service_sessions", ["waiter_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_service_sessions_waiter_id", table_name="service_sessions")
    op.drop_index("ix_service_sessions_table_id", table_name="service_sessions")
    op.drop_index("ix_service_sessions_status", table_name="service_sessions")
    op.drop_index("ix_service_sessions_customer_id", table_name="service_sessions")
    op.drop_table("service_sessions")
