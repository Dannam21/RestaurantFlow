"""Add per-dish estimated_time to order_dishes.

Revision ID: 0015
Revises: 0014
Create Date: 2026-08-09
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0015"
down_revision: str | None = "0014"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

CATEGORY_ESTIMATED_MINUTES: dict[str, int] = {
    "bebidas": 3,
    "postres": 5,
}
DRINK_KEYWORDS = (
    "bebida",
    "jugo",
    "cafe",
    "gaseosa",
    "limonada",
    "chicha",
    "agua",
    "te",
    "refresco",
    "soda",
    "cerveza",
    "vino",
    "coctel",
    "kola",
    "cola",
)
DESSERT_KEYWORDS = ("postre", "pastel", "cake", "helado", "torta", "suspiro")
LIGHT_KEYWORDS = ("ensalada", "sopa", "entrada")


def _estimate_by_name(name: str) -> int | None:
    normalized = (name or "").lower()
    if any(keyword in normalized for keyword in DRINK_KEYWORDS):
        return 3
    if any(keyword in normalized for keyword in DESSERT_KEYWORDS):
        return 5
    if any(keyword in normalized for keyword in LIGHT_KEYWORDS):
        return 8
    return None


def upgrade() -> None:
    op.add_column(
        "order_dishes",
        sa.Column(
            "estimated_time",
            sa.Integer(),
            nullable=False,
            server_default="15",
        ),
    )

    order_dishes = sa.table(
        "order_dishes",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String(length=150)),
        sa.column("product_id", sa.String(length=100)),
        sa.column("estimated_time", sa.Integer()),
    )
    menu_items = sa.table(
        "menu_items",
        sa.column("id", sa.Uuid()),
        sa.column("category", sa.String(length=80)),
    )

    connection = op.get_bind()
    categories_by_product_id = {
        str(menu_item_id): category
        for menu_item_id, category in connection.execute(
            sa.select(menu_items.c.id, menu_items.c.category)
        ).all()
    }

    rows = connection.execute(
        sa.select(order_dishes.c.id, order_dishes.c.name, order_dishes.c.product_id)
    ).all()
    for dish_id, name, product_id in rows:
        category = categories_by_product_id.get(product_id or "")
        if category is not None:
            estimated_time = CATEGORY_ESTIMATED_MINUTES.get(category.lower())
        else:
            estimated_time = _estimate_by_name(name)
        if estimated_time is None:
            continue
        connection.execute(
            order_dishes.update()
            .where(order_dishes.c.id == dish_id)
            .values(estimated_time=estimated_time)
        )


def downgrade() -> None:
    op.drop_column("order_dishes", "estimated_time")
