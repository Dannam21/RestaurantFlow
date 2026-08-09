import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import MenuItem, Order, OrderDish
from db.models import utc_now
from schemas.models import OrderDishStatus
from services import portal_service


logger = logging.getLogger(__name__)

ALLOWED_DISH_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"preparing"},
    "preparing": {"ready"},
    "ready": {"delivered"},
    "delivered": set(),
}

# Deterministic per-item duration estimate so a drink doesn't inherit the
# same prep time as a complex cooked dish. The primary signal is the item's
# real menu category (MenuItem.category); a name-keyword heuristic is only
# used as a fallback for ad-hoc items with no matching product_id.
CATEGORY_ESTIMATED_MINUTES: dict[str, int] = {
    "bebidas": 3,
    "postres": 5,
}
DRINK_KEYWORDS = (
    "bebida",
    "jugo",
    "cafe",
    "café",
    "gaseosa",
    "limonada",
    "chicha",
    "agua",
    "te",
    "té",
    "refresco",
    "soda",
    "cerveza",
    "vino",
    "coctel",
    "cóctel",
    "kola",
    "cola",
)
DESSERT_KEYWORDS = ("postre", "pastel", "cake", "helado", "torta", "suspiro")
LIGHT_KEYWORDS = ("ensalada", "sopa", "entrada")

DRINK_ESTIMATED_MINUTES = 3
DESSERT_ESTIMATED_MINUTES = 5
LIGHT_ESTIMATED_MINUTES = 8
DEFAULT_ESTIMATED_MINUTES = 15


class OrderDishConflictError(ValueError):
    pass


def estimate_minutes_by_name(name: str) -> int:
    normalized = name.lower()
    if any(keyword in normalized for keyword in DRINK_KEYWORDS):
        return DRINK_ESTIMATED_MINUTES
    if any(keyword in normalized for keyword in DESSERT_KEYWORDS):
        return DESSERT_ESTIMATED_MINUTES
    if any(keyword in normalized for keyword in LIGHT_KEYWORDS):
        return LIGHT_ESTIMATED_MINUTES
    return DEFAULT_ESTIMATED_MINUTES


async def create_dishes_for_order(
    session: AsyncSession, order: Order
) -> list[OrderDish]:
    product_ids = {
        item["product_id"] for item in order.items if item.get("product_id")
    }
    categories_by_product_id: dict[str, str] = {}
    if product_ids:
        statement = select(MenuItem.id, MenuItem.category).where(
            MenuItem.id.in_(product_ids)
        )
        categories_by_product_id = {
            str(menu_item_id): category
            for menu_item_id, category in await session.execute(statement)
        }

    def estimate_minutes(item: dict) -> int:
        category = categories_by_product_id.get(item.get("product_id") or "")
        if category is not None:
            return CATEGORY_ESTIMATED_MINUTES.get(
                category.lower(), DEFAULT_ESTIMATED_MINUTES
            )
        return estimate_minutes_by_name(item["name"])

    dishes = [
        OrderDish(
            order_id=order.id,
            table_id=order.table_id,
            product_id=item.get("product_id"),
            name=item["name"],
            quantity=item.get("quantity", 1),
            notes=item.get("notes"),
            price=item.get("price"),
            status="preparing",
            estimated_time=estimate_minutes(item),
        )
        for item in order.items
    ]
    session.add_all(dishes)
    await session.flush()
    return dishes


async def list_dishes(
    session: AsyncSession,
    order_id: UUID | None = None,
    table_id: int | None = None,
    status: OrderDishStatus | None = None,
) -> list[OrderDish]:
    statement = select(OrderDish)
    if order_id is not None:
        statement = statement.where(OrderDish.order_id == order_id)
    if table_id is not None:
        statement = statement.where(OrderDish.table_id == table_id)
    if status is not None:
        statement = statement.where(OrderDish.status == status)

    statement = statement.order_by(OrderDish.created_at.asc())
    result = await session.scalars(statement)
    return list(result.all())


async def get_dish(session: AsyncSession, dish_id: UUID) -> OrderDish | None:
    return await session.get(OrderDish, dish_id)


async def update_dish_status(
    session: AsyncSession, dish_id: UUID, status: OrderDishStatus
) -> OrderDish | None:
    dish = await session.get(OrderDish, dish_id)
    if dish is None:
        return None

    if status != dish.status and status not in ALLOWED_DISH_TRANSITIONS.get(
        dish.status, set()
    ):
        raise OrderDishConflictError(
            f"Invalid dish status transition: {dish.status} -> {status}"
        )

    if status == dish.status:
        return dish

    dish.status = status
    if status == "delivered":
        dish.delivered_at = utc_now()

    await session.commit()
    await session.refresh(dish)

    await portal_service.publish_dish_event(
        "dish.status_changed",
        {
            "dish_id": str(dish.id),
            "order_id": str(dish.order_id),
            "table_id": dish.table_id,
            "name": dish.name,
            "status": dish.status,
        },
    )
    logger.info("Dish status updated dish_id=%s status=%s", dish.id, dish.status)
    return dish
