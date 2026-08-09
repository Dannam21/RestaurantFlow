from datetime import datetime
import re
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


OrderStatus = Literal["pending", "analyzing", "cooking", "ready", "served", "paid"]
OrderDishStatus = Literal["pending", "preparing", "ready", "delivered"]
TableStatus = Literal["empty", "waiting_order", "cooking", "eating", "paying"]
WaitlistStatus = Literal["waiting", "notified", "seated", "cancelled"]
MessageSender = Literal["client", "waiter", "chef", "admin", "system", "bot"]
MessageRecipient = Literal["client", "waiter", "chef", "admin"]
MessageType = Literal["message", "customer_request", "kitchen_note", "system"]
StaffRole = Literal["admin", "waiter", "chef"]
Complexity = Literal["low", "medium", "high"]
Priority = Literal["low", "normal", "high", "critical"]
AlertSeverity = Literal["info", "warning", "critical"]
ReservationTrackingStatus = Literal["reserved", "released"]
ServiceSessionStatus = Literal["active", "completed"]
WaiterTableAction = Literal["ready", "served", "paying", "paid"]


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


class OrderDishResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    table_id: int
    product_id: str | None
    name: str
    quantity: int
    notes: str | None
    price: float | None
    status: str
    estimated_time: int
    progress: int
    delivered_at: datetime | None
    created_at: datetime
    updated_at: datetime


class OrderDishStatusUpdate(BaseModel):
    status: OrderDishStatus


class TableUpdate(BaseModel):
    status: TableStatus | None = None
    customers: int | None = Field(default=None, ge=0)
    capacity: int | None = Field(default=None, ge=1, le=20)
    order_id: UUID | None = None
    customer_id: UUID | None = None


class TableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    customers: int
    capacity: int
    order_id: UUID | None
    customer_id: UUID | None
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


class ReservationTrackingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    customer_id: UUID
    table_id: int
    party_size: int
    status: ReservationTrackingStatus
    reserved_at: datetime
    released_at: datetime | None
    created_at: datetime
    updated_at: datetime


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


class StaffUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    role: StaffRole
    email: str


class ServiceSessionAssignmentUpdate(BaseModel):
    waiter_id: UUID | None = None


class ServiceSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    table_id: int
    customer_id: UUID | None
    waiter_id: UUID | None
    order_id: UUID | None
    status: ServiceSessionStatus
    seated_at: datetime
    waiter_assigned_at: datetime | None
    order_sent_at: datetime | None
    closed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class WaiterTableActionRequest(BaseModel):
    waiter_id: UUID
    action: WaiterTableAction


class MenuItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    category: str
    price: float
    is_available: bool
    created_at: datetime
    updated_at: datetime


class WaitlistEntryCreate(BaseModel):
    customer_id: UUID | None = None
    full_name: str = Field(min_length=1, max_length=150)
    email: str | None = Field(default=None, max_length=320)
    phone: str | None = Field(default=None, max_length=40)
    party_size: int = Field(ge=1, le=20)
    quoted_wait_minutes: int | None = Field(default=None, ge=0, le=240)
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("full_name")
    @classmethod
    def validate_waitlist_full_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Full name cannot be empty")
        return value

    @field_validator("email")
    @classmethod
    def validate_waitlist_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().lower()
        if not normalized:
            return None
        if not EMAIL_PATTERN.match(normalized):
            raise ValueError("Invalid email format")
        return normalized

    @field_validator("phone")
    @classmethod
    def validate_waitlist_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("notes")
    @classmethod
    def validate_waitlist_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class WaitlistEntryUpdate(BaseModel):
    status: WaitlistStatus | None = None
    quoted_wait_minutes: int | None = Field(default=None, ge=0, le=240)
    notes: str | None = Field(default=None, max_length=500)
    table_id: int | None = Field(default=None, gt=0)

    @field_validator("notes")
    @classmethod
    def validate_waitlist_update_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class WaitlistEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    customer_id: UUID | None
    full_name: str
    email: str | None
    phone: str | None
    party_size: int
    status: str
    quoted_wait_minutes: int | None
    notes: str | None
    table_id: int | None
    notified_at: datetime | None
    seated_at: datetime | None
    created_at: datetime
    updated_at: datetime


class WaitlistAvailabilityResponse(BaseModel):
    available: bool
    estimated_wait_minutes: int | None
    table_id: int | None = None


class WaitlistJoinRequest(BaseModel):
    customer_id: UUID | None = None
    full_name: str = Field(min_length=1, max_length=150)
    email: str | None = Field(default=None, max_length=320)
    phone: str | None = Field(default=None, max_length=40)
    party_size: int = Field(ge=1, le=20)

    @field_validator("full_name")
    @classmethod
    def validate_join_full_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Full name cannot be empty")
        return value

    @field_validator("email")
    @classmethod
    def validate_join_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().lower()
        if not normalized:
            return None
        if not EMAIL_PATTERN.match(normalized):
            raise ValueError("Invalid email format")
        return normalized

    @field_validator("phone")
    @classmethod
    def validate_join_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class WaitlistJoinResponse(BaseModel):
    outcome: Literal["seated", "queued"]
    table_id: int | None = None
    entry: WaitlistEntryResponse | None = None
    estimated_wait_minutes: int | None = None


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
    waitlist: list[WaitlistEntryResponse]
    alerts: list[AgentActivityResponse]
    agent_activity: list[AgentActivityResponse]
    recent_requests: list[MessageResponse]
