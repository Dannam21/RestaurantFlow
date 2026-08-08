from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


OrderStatus = Literal["pending", "analyzing", "cooking", "ready", "served", "paid"]
TableStatus = Literal["empty", "waiting_order", "cooking", "eating", "paying"]


class OrderItem(BaseModel):
    product_id: str | None = None
    name: str
    quantity: int = Field(ge=1)
    notes: str | None = None
    price: float | None = None


class OrderCreate(BaseModel):
    table_id: int = Field(gt=0)
    items: list[OrderItem] = Field(min_length=1)


class OrderProgressUpdate(BaseModel):
    progress: int = Field(ge=0, le=100)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    table_id: int
    items: list[OrderItem]
    status: str
    progress: int
    estimated_time: int | None
    created_at: datetime
    updated_at: datetime


class TableUpdate(BaseModel):
    status: TableStatus | None = None
    customers: int | None = Field(default=None, ge=0)
    order_id: UUID | None = None


class TableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    customers: int
    order_id: UUID | None
    created_at: datetime
    updated_at: datetime
