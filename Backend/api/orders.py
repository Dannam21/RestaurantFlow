from uuid import UUID

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    status as http_status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from schemas.models import (
    OrderCreate,
    OrderProgressUpdate,
    OrderResponse,
    OrderStatus,
    OrderStatusUpdate,
)
from services import ai_service, order_service


router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post(
    "", response_model=OrderResponse, status_code=http_status.HTTP_201_CREATED
)
async def create_order(
    order_data: OrderCreate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db),
) -> OrderResponse:
    order = await order_service.create_order(session, order_data)
    if order is None:
        raise HTTPException(status_code=404, detail="Table not found")
    background_tasks.add_task(ai_service.process_new_order, order.id)
    return OrderResponse.model_validate(order)


@router.get("", response_model=list[OrderResponse])
async def list_orders(
    status: OrderStatus | None = None,
    session: AsyncSession = Depends(get_db),
) -> list[OrderResponse]:
    orders = await order_service.get_orders(session, status)
    return [OrderResponse.model_validate(order) for order in orders]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    session: AsyncSession = Depends(get_db),
) -> OrderResponse:
    order = await order_service.get_order_by_id(session, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse.model_validate(order)


@router.put("/{order_id}/progress", response_model=OrderResponse)
async def update_order_progress(
    order_id: UUID,
    update: OrderProgressUpdate,
    session: AsyncSession = Depends(get_db),
) -> OrderResponse:
    order = await order_service.update_order_progress(
        session, order_id, update.progress
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse.model_validate(order)


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    update: OrderStatusUpdate,
    session: AsyncSession = Depends(get_db),
) -> OrderResponse:
    order = await order_service.update_order_status(session, order_id, update.status)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse.model_validate(order)
