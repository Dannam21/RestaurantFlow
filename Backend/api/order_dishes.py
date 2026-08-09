from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from schemas.models import OrderDishResponse, OrderDishStatus, OrderDishStatusUpdate
from services import order_dish_service


router = APIRouter(prefix="/api/order-dishes", tags=["order-dishes"])


@router.get("", response_model=list[OrderDishResponse])
async def list_order_dishes(
    order_id: UUID | None = None,
    table_id: int | None = Query(default=None, gt=0),
    status: OrderDishStatus | None = None,
    session: AsyncSession = Depends(get_db),
) -> list[OrderDishResponse]:
    dishes = await order_dish_service.list_dishes(
        session, order_id=order_id, table_id=table_id, status=status
    )
    return [OrderDishResponse.model_validate(dish) for dish in dishes]


@router.put("/{dish_id}/status", response_model=OrderDishResponse)
async def update_order_dish_status(
    dish_id: UUID,
    update: OrderDishStatusUpdate,
    session: AsyncSession = Depends(get_db),
) -> OrderDishResponse:
    try:
        dish = await order_dish_service.update_dish_status(
            session, dish_id, update.status
        )
    except order_dish_service.OrderDishConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    if dish is None:
        raise HTTPException(status_code=404, detail="Dish not found")
    return OrderDishResponse.model_validate(dish)
