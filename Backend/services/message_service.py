import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import Message
from schemas.models import MessageCreate, MessageSender
from services import portal_service


logger = logging.getLogger(__name__)
STAFF_ROLES = {"waiter", "chef", "admin"}


async def create_message(
    session: AsyncSession, message_data: MessageCreate
) -> Message:
    message = Message(**message_data.model_dump())
    session.add(message)
    await session.commit()
    await session.refresh(message)

    logger.info(
        "Message created table=%s sender=%s",
        message.table_id,
        message.sender,
    )

    payload = {
        "message_id": str(message.id),
        "sender": message.sender,
        "sender_id": message.sender_id,
        "recipient_role": message.recipient_role,
        "table_id": message.table_id,
        "order_id": str(message.order_id) if message.order_id else None,
        "text": message.text,
        "message_type": message.message_type,
        "created_at": message.created_at.isoformat(),
    }

    is_staff_message = (
        message.sender in STAFF_ROLES and message.recipient_role in STAFF_ROLES
    )
    if is_staff_message:
        await portal_service.publish_staff_chat_event("chat.message_created", payload)
    elif message.table_id is not None:
        await portal_service.publish_table_chat_event(
            message.table_id, "chat.message_created", payload
        )
    else:
        await portal_service.publish_chat_event("chat.message_created", payload)

    if message.message_type == "customer_request":
        await portal_service.publish_notification(
            "notification.customer_request",
            {
                "table_id": message.table_id,
                "sender_id": message.sender_id,
                "message": message.text,
                "target_role": message.recipient_role or "waiter",
            },
        )
    elif message.recipient_role is not None and message.message_type in {
        "message",
        "kitchen_note",
    }:
        await portal_service.publish_notification(
            "notification.new_message",
            {
                "message_id": str(message.id),
                "table_id": message.table_id,
                "sender": message.sender,
                "message": message.text,
                "target_role": message.recipient_role,
            },
        )

    return message


async def get_messages(
    session: AsyncSession,
    table_id: int | None = None,
    order_id: UUID | None = None,
    sender: MessageSender | None = None,
    limit: int = 50,
) -> list[Message]:
    statement = select(Message)
    if table_id is not None:
        statement = statement.where(Message.table_id == table_id)
    if order_id is not None:
        statement = statement.where(Message.order_id == order_id)
    if sender is not None:
        statement = statement.where(Message.sender == sender)

    statement = statement.order_by(Message.created_at.desc()).limit(limit)
    result = await session.scalars(statement)
    return list(reversed(result.all()))
