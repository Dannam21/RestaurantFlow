"""Add customer_id column to tables.

Revision ID: 0011
Revises: 0010
Create Date: 2026-08-08
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0011"
down_revision: str | None = "0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tables",
        sa.Column("customer_id", sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        "fk_tables_customer_id_customers",
        "tables",
        "customers",
        ["customer_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_tables_customer_id_customers", "tables", type_="foreignkey"
    )
    op.drop_column("tables", "customer_id")
