from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_table_id", "table_id"),
        Index("ix_orders_status", "status"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    table_id: Mapped[int] = mapped_column(Integer, nullable=False)
    items: Mapped[list[dict[str, Any]] | dict[str, Any]] = mapped_column(
        JSON, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), default="pending", nullable=False
    )
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estimated_time: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estimated_duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )


class Table(Base):
    __tablename__ = "tables"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    status: Mapped[str] = mapped_column(String(50), default="empty", nullable=False)
    customers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    order_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("orders.id"), nullable=True
    )
    customer_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("customers.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        Index("ix_messages_order_id", "order_id"),
        Index("ix_messages_table_id", "table_id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    sender: Mapped[str] = mapped_column(String(50), nullable=False)
    sender_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    recipient_role: Mapped[str | None] = mapped_column(String(50), nullable=True)
    table_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[str] = mapped_column(
        String(50), default="message", server_default="message", nullable=False
    )
    order_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("orders.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )


class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (Index("ix_customers_email", "email", unique=True),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    is_verified: Mapped[bool] = mapped_column(default=False, nullable=False)
    verification_code: Mapped[str | None] = mapped_column(String(6), nullable=True)
    verification_code_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )


class StaffUser(Base):
    __tablename__ = "staff_users"
    __table_args__ = (Index("ix_staff_users_email", "email", unique=True),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )


class MenuItem(Base):
    __tablename__ = "menu_items"
    __table_args__ = (
        Index("ix_menu_items_category", "category"),
        Index("ix_menu_items_is_available", "is_available"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    price: Mapped[float] = mapped_column(nullable=False)
    is_available: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )


class WaitlistEntry(Base):
    __tablename__ = "waitlist_entries"
    __table_args__ = (
        Index("ix_waitlist_entries_status", "status"),
        Index("ix_waitlist_entries_created_at", "created_at"),
        Index("ix_waitlist_entries_customer_id", "customer_id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    customer_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("customers.id"), nullable=True
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    party_size: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="waiting", nullable=False)
    quoted_wait_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    table_id: Mapped[int | None] = mapped_column(
        ForeignKey("tables.id"), nullable=True
    )
    notified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    seated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )


class ReservationTracking(Base):
    __tablename__ = "reservation_tracking"
    __table_args__ = (
        Index("ix_reservation_tracking_customer_id", "customer_id"),
        Index("ix_reservation_tracking_table_id", "table_id"),
        Index("ix_reservation_tracking_reserved_at", "reserved_at"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    customer_id: Mapped[UUID] = mapped_column(
        ForeignKey("customers.id"), nullable=False
    )
    table_id: Mapped[int] = mapped_column(ForeignKey("tables.id"), nullable=False)
    party_size: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="reserved", nullable=False)
    reserved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    released_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )


class ServiceSession(Base):
    __tablename__ = "service_sessions"
    __table_args__ = (
        Index("ix_service_sessions_table_id", "table_id"),
        Index("ix_service_sessions_customer_id", "customer_id"),
        Index("ix_service_sessions_waiter_id", "waiter_id"),
        Index("ix_service_sessions_status", "status"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    table_id: Mapped[int] = mapped_column(ForeignKey("tables.id"), nullable=False)
    customer_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("customers.id"), nullable=True
    )
    waiter_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("staff_users.id"), nullable=True
    )
    order_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("orders.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    seated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    waiter_assigned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    order_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )


class AgentLog(Base):
    __tablename__ = "agent_logs"
    __table_args__ = (Index("ix_agent_logs_agent_name", "agent_name"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    input_data: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(
        JSON, nullable=True
    )
    output_data: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(
        JSON, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
