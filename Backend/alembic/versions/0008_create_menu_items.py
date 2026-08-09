"""Create menu_items table and seed initial catalog.

Revision ID: 0008
Revises: 0007
Create Date: 2026-08-08
"""

from collections.abc import Sequence
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from alembic import op
import sqlalchemy as sa


revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SEED_NAMES = (
    "Ceviche Clasico",
    "Lomo Saltado",
    "Aji de Gallina",
    "Inca Kola",
    "Chicha Morada",
    "Suspiro a la Limena",
)


def upgrade() -> None:
    op.create_table(
        "menu_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("is_available", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_menu_items_category", "menu_items", ["category"], unique=False
    )
    op.create_index(
        "ix_menu_items_is_available", "menu_items", ["is_available"], unique=False
    )

    menu_items = sa.table(
        "menu_items",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String(length=150)),
        sa.column("description", sa.Text()),
        sa.column("category", sa.String(length=80)),
        sa.column("price", sa.Float()),
        sa.column("is_available", sa.Boolean()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    timestamp = datetime.now(timezone.utc)

    op.bulk_insert(
        menu_items,
        [
            {
                "id": uuid4(),
                "name": "Ceviche Clasico",
                "description": "Pescado fresco marinado en limon con camote y choclo.",
                "category": "Fondos",
                "price": Decimal("35.00"),
                "is_available": True,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
            {
                "id": uuid4(),
                "name": "Lomo Saltado",
                "description": "Lomo salteado con cebolla, tomate y papas fritas.",
                "category": "Fondos",
                "price": Decimal("32.50"),
                "is_available": True,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
            {
                "id": uuid4(),
                "name": "Aji de Gallina",
                "description": "Pollo deshilachado en crema de aji amarillo y nuez.",
                "category": "Fondos",
                "price": Decimal("28.00"),
                "is_available": True,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
            {
                "id": uuid4(),
                "name": "Inca Kola",
                "description": "Gaseosa personal de 500 ml.",
                "category": "Bebidas",
                "price": Decimal("6.50"),
                "is_available": True,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
            {
                "id": uuid4(),
                "name": "Chicha Morada",
                "description": "Bebida tradicional fria de maiz morado.",
                "category": "Bebidas",
                "price": Decimal("8.00"),
                "is_available": True,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
            {
                "id": uuid4(),
                "name": "Suspiro a la Limena",
                "description": "Postre cremoso con merengue y toque de oporto.",
                "category": "Postres",
                "price": Decimal("14.00"),
                "is_available": True,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
        ],
    )


def downgrade() -> None:
    placeholders = ", ".join(f"'{name}'" for name in SEED_NAMES)
    op.execute(sa.text(f"DELETE FROM menu_items WHERE name IN ({placeholders})"))
    op.drop_index("ix_menu_items_is_available", table_name="menu_items")
    op.drop_index("ix_menu_items_category", table_name="menu_items")
    op.drop_table("menu_items")
