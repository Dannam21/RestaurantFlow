"""Extend messages for realtime chat.

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-08
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "messages", sa.Column("recipient_role", sa.String(length=50), nullable=True)
    )
    op.add_column("messages", sa.Column("table_id", sa.Integer(), nullable=True))
    op.add_column(
        "messages",
        sa.Column(
            "message_type",
            sa.String(length=50),
            server_default="message",
            nullable=False,
        ),
    )
    op.create_index("ix_messages_table_id", "messages", ["table_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_messages_table_id", table_name="messages")
    op.drop_column("messages", "message_type")
    op.drop_column("messages", "table_id")
    op.drop_column("messages", "recipient_role")
