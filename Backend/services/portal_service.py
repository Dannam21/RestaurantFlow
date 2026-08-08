import json
import logging
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote

import httpx

from config import settings


logger = logging.getLogger(__name__)


def _channel(resource: str) -> str:
    return f"restaurant:{settings.restaurant_id}:{resource}"


def _resource_id(payload: dict[str, Any]) -> str | int | None:
    return payload.get("order_id") or payload.get("table_id")


async def publish_event(
    channel: str,
    event_type: str,
    payload: dict[str, Any],
) -> None:
    resource_id = _resource_id(payload)
    if not settings.portal_enabled:
        logger.info(
            "Portal disabled channel=%s type=%s resource_id=%s",
            channel,
            event_type,
            resource_id,
        )
        return

    try:
        event = {
            "type": event_type,
            "restaurant_id": settings.restaurant_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": payload,
        }
        if len(json.dumps(event, separators=(",", ":")).encode("utf-8")) > 2048:
            logger.error(
                "Portal event failed: content exceeds 2 KB channel=%s type=%s "
                "resource_id=%s",
                channel,
                event_type,
                resource_id,
            )
            return

        url = (
            f"{settings.portal_api_url.rstrip('/')}/v1/channels/"
            f"{quote(channel, safe='')}/messages"
        )
        request_body = {
            "senderId": settings.portal_sender_id,
            "type": event_type,
            "content": event,
            "kind": "text",
        }

        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {settings.portal_secret_key}",
                    "Content-Type": "application/json",
                },
                json=request_body,
            )
            response.raise_for_status()
    except Exception:
        logger.exception(
            "Portal event failed channel=%s type=%s resource_id=%s",
            channel,
            event_type,
            resource_id,
        )
        return

    logger.info(
        "Portal event published channel=%s type=%s resource_id=%s",
        channel,
        event_type,
        resource_id,
    )


async def publish_order_event(event_type: str, payload: dict[str, Any]) -> None:
    await publish_event(_channel("orders"), event_type, payload)


async def publish_dish_event(event_type: str, payload: dict[str, Any]) -> None:
    await publish_event(_channel("dishes"), event_type, payload)


async def publish_table_event(event_type: str, payload: dict[str, Any]) -> None:
    await publish_event(_channel("tables"), event_type, payload)


async def publish_notification(event_type: str, payload: dict[str, Any]) -> None:
    await publish_event(_channel("notifications"), event_type, payload)


async def publish_table_chat_event(
    table_id: int, event_type: str, payload: dict[str, Any]
) -> None:
    await publish_event(_channel(f"table:{table_id}:chat"), event_type, payload)


async def publish_staff_chat_event(
    event_type: str, payload: dict[str, Any]
) -> None:
    await publish_event(_channel("staff:chat"), event_type, payload)


async def publish_chat_event(event_type: str, payload: dict[str, Any]) -> None:
    await publish_event(_channel("chat"), event_type, payload)


async def publish_dish_ready_notification(order_id: str, table_id: int) -> None:
    await publish_notification(
        "notification.dish_ready",
        {
            "order_id": order_id,
            "table_id": table_id,
            "message": "Order ready for pickup",
        },
    )


async def publish_table_available_notification(table_id: int) -> None:
    await publish_notification(
        "notification.table_available",
        {
            "table_id": table_id,
            "status": "empty",
            "message": f"Mesa {table_id} disponible",
        },
    )


async def publish_state_event(payload: dict[str, Any]) -> None:
    await publish_event(_channel("state"), "restaurant.state_changed", payload)


async def publish_agent_event(event_type: str, payload: dict[str, Any]) -> None:
    await publish_event(_channel("agents"), event_type, payload)
