from datetime import datetime
import re
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


OrderStatus = Literal["pending", "analyzing", "cooking", "ready", "served", "paid"]
TableStatus = Literal["empty", "waiting_order", "cooking", "eating", "paying"]
MessageSender = Literal["client", "waiter", "chef", "admin", "system"]
MessageRecipient = Literal["client", "waiter", "chef", "admin"]
MessageType = Literal["message", "customer_request", "kitchen_note", "system"]
StaffRole = Literal["admin", "waiter", "chef"]
Complexity = Literal["low", "medium", "high"]
Priority = Literal["low", "normal", "high", "critical"]
AlertSeverity = Literal["info", "warning", "critical"]


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


class CustomerRegisterRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Full name cannot be empty")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not EMAIL_PATTERN.match(normalized):
            raise ValueError("Invalid email format")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return normalized


class CustomerVerifyRequest(BaseModel):
    email: str = Field(min_length=5, max_length=320)
    code: str = Field(min_length=6, max_length=6)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not EMAIL_PATTERN.match(normalized):
            raise ValueError("Invalid email format")
        return normalized

    @field_validator("code")
    @classmethod
    def validate_code(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized.isdigit():
            raise ValueError("Verification code must contain only digits")
        return normalized


class CustomerLoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not EMAIL_PATTERN.match(normalized):
            raise ValueError("Invalid email format")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return normalized


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: str
    is_verified: bool
    verified_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CustomerRegisterResponse(BaseModel):
    message: str
    customer_id: UUID
    email: str
    expires_in_minutes: int


class StaffLoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not EMAIL_PATTERN.match(normalized):
            raise ValueError("Invalid email format")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return normalized


class StaffLoginResponse(BaseModel):
    staff_id: UUID
    name: str
    role: StaffRole
    email: str


class AnalyzerResult(BaseModel):
    complexity: Complexity
    estimated_time: int = Field(ge=1, le=240)
    warnings: list[str] = Field(default_factory=list, max_length=20)
    reasoning_summary: str = Field(min_length=1, max_length=500)


class PriorityItem(BaseModel):
    order_id: UUID
    priority: Priority
    score: int = Field(ge=0, le=100)
    reason: str = Field(min_length=1, max_length=500)


class PrioritizerResult(BaseModel):
    priorities: list[PriorityItem]


class OperationalAlert(BaseModel):
    alert_type: Literal[
        "order.delayed", "dish.waiting_pickup", "order.waiting_to_start"
    ]
    order_id: UUID
    table_id: int
    severity: AlertSeverity
    message: str = Field(min_length=1, max_length=500)
    detected_at: datetime


class StatsResponse(BaseModel):
    total_orders: int
    active_orders: int
    completed_orders: int
    average_order_time_minutes: float
    average_estimated_time_minutes: float
    tables_total: int
    tables_occupied: int
    tables_available: int
    messages_today: int
    alerts_today: int
    revenue_today: float | None = None
    satisfaction: float | None = None


class AgentActivityResponse(BaseModel):
    id: UUID
    agent_name: str
    action: str
    output_data: dict[str, Any] | list[Any] | None
    created_at: datetime


class DashboardResponse(BaseModel):
    stats: StatsResponse
    orders: list[OrderResponse]
    tables: list[TableResponse]
    alerts: list[AgentActivityResponse]
    agent_activity: list[AgentActivityResponse]
    recent_requests: list[MessageResponse]
