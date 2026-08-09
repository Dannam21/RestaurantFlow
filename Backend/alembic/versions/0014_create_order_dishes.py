"""Create order_dishes table.

Revision ID: 0014
Revises: 0013
Create Date: 2026-08-08
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0014"
down_revision: str | None = "0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "order_dishes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("table_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.String(length=100), nullable=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("price", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["table_id"], ["tables.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_order_dishes_order_id", "order_dishes", ["order_id"], unique=False
    )
    op.create_index(
        "ix_order_dishes_table_id", "order_dishes", ["table_id"], unique=False
    )
    op.create_index(
        "ix_order_dishes_status", "order_dishes", ["status"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_order_dishes_status", table_name="order_dishes")
    op.drop_index("ix_order_dishes_table_id", table_name="order_dishes")
    op.drop_index("ix_order_dishes_order_id", table_name="order_dishes")
    op.drop_table("order_dishes")
