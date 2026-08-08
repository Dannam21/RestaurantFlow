"""Seed development staff users.

Revision ID: 0007
Revises: 0006
Create Date: 2026-08-08
"""

from collections.abc import Sequence
from datetime import datetime, timezone
from uuid import uuid4

from alembic import op
from passlib.context import CryptContext
import sqlalchemy as sa


revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SEED_EMAILS = ("admin@rest.com", "juan@rest.com", "chef@rest.com")


def upgrade() -> None:
    staff_users = sa.table(
        "staff_users",
        sa.column("id", sa.Uuid()),
        sa.column("email", sa.String(length=320)),
        sa.column("password_hash", sa.String(length=256)),
        sa.column("role", sa.String(length=20)),
        sa.column("name", sa.String(length=150)),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    timestamp = datetime.now(timezone.utc)
    password_hash = pwd_context.hash("password123")

    op.bulk_insert(
        staff_users,
        [
            {
                "id": uuid4(),
                "email": "admin@rest.com",
                "password_hash": password_hash,
                "role": "admin",
                "name": "Admin",
                "created_at": timestamp,
            },
            {
                "id": uuid4(),
                "email": "juan@rest.com",
                "password_hash": password_hash,
                "role": "waiter",
                "name": "Juan",
                "created_at": timestamp,
            },
            {
                "id": uuid4(),
                "email": "chef@rest.com",
                "password_hash": password_hash,
                "role": "chef",
                "name": "Chef",
                "created_at": timestamp,
            },
        ],
    )


def downgrade() -> None:
    placeholders = ", ".join(f"'{email}'" for email in SEED_EMAILS)
    op.execute(sa.text(f"DELETE FROM staff_users WHERE email IN ({placeholders})"))
