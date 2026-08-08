from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


OrderStatus = Literal["pending", "analyzing", "cooking", "ready", "served", "paid"]
TableStatus = Literal["empty", "waiting_order", "cooking", "eating", "paying"]
MessageSender = Literal["client", "waiter", "chef", "admin", "system"]
MessageRecipient = Literal["client", "waiter", "chef", "admin"]
MessageType = Literal["message", "customer_request", "kitchen_note", "system"]


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


class MessageCreate(BaseModel):
    sender: MessageSender
    sender_id: str | None = None
    recipient_role: MessageRecipient | None = None
    table_id: int | None = Field(default=None, gt=0)
    order_id: UUID | None = None
    text: str = Field(min_length=1, max_length=1000)
    message_type: MessageType = "message"

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message text cannot be empty")
        return value


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    sender: str
    sender_id: str | None
    recipient_role: str | None
    table_id: int | None
    order_id: UUID | None
    text: str
    message_type: str
    created_at: datetime
