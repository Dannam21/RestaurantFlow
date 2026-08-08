"""Seed development tables.

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-08
"""

from collections.abc import Sequence
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa


revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    tables = sa.table(
        "tables",
        sa.column("id", sa.Integer()),
        sa.column("status", sa.String(length=50)),
        sa.column("customers", sa.Integer()),
        sa.column("order_id", sa.Uuid()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    timestamp = datetime.now(timezone.utc)
    op.bulk_insert(
        tables,
        [
            {
                "id": table_id,
                "status": "empty",
                "customers": 0,
                "order_id": None,
                "created_at": timestamp,
                "updated_at": timestamp,
            }
            for table_id in range(1, 11)
        ],
    )


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM tables WHERE id BETWEEN 1 AND 10"))
