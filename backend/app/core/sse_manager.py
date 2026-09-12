"""
SSE (Server-Sent Events) connection manager for real-time notification push.

Architecture:
  - Backend writes to Redis pub/sub channel "notif:{user_id}" whenever
    a new Notification is persisted.
  - SSE clients (browser EventSource) connect to GET /notifications/stream.
  - SSEManager subscribes to the user's Redis channel and forwards events.
  - On lost connection (client navigates away), the subscription is cleaned up.

This module intentionally avoids asyncio.Queue so it is thread-safe when
Celery workers publish from a separate process.
"""
import asyncio
import json
import logging
from typing import AsyncGenerator

logger = logging.getLogger("denno.sse")

CHANNEL_PREFIX = "notif:"


def _channel(user_id: int) -> str:
    return f"{CHANNEL_PREFIX}{user_id}"


async def event_stream(user_id: int) -> AsyncGenerator[str, None]:
    """
    Async generator that yields SSE-formatted strings for the given user.

    Yields:
        SSE lines such as::

            data: {"type": "notification", "count": 3}\n\n

        A "heartbeat" comment line is sent every 30 seconds to keep the
        connection alive through proxies that time out idle connections.
    """
    from app.core.redis_client import get_redis

    redis = get_redis()

    # Send an immediate "connected" event so the client knows the stream is live.
    yield f"data: {json.dumps({'type': 'connected', 'user_id': user_id})}\n\n"

    channel = _channel(user_id)
    pubsub = redis.pubsub()
    await pubsub.subscribe(channel)
    logger.debug("[SSE] User %s subscribed to channel %s", user_id, channel)

    try:
        heartbeat_interval = 30  # seconds
        elapsed = 0
        poll_interval = 0.5  # seconds between pubsub polls

        while True:
            # Check for a new message (non-blocking)
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=poll_interval)
            if message and message.get("type") == "message":
                raw = message.get("data", b"")
                if isinstance(raw, bytes):
                    raw = raw.decode("utf-8")
                try:
                    payload = json.loads(raw)
                except (json.JSONDecodeError, TypeError):
                    payload = {"type": "notification"}
                yield f"data: {json.dumps(payload)}\n\n"
                elapsed = 0  # reset heartbeat timer on real event

            elapsed += poll_interval
            if elapsed >= heartbeat_interval:
                # Send a comment (: ) as keepalive — ignored by EventSource
                yield ": heartbeat\n\n"
                elapsed = 0

    except asyncio.CancelledError:
        logger.debug("[SSE] User %s stream cancelled (client disconnected)", user_id)
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
        logger.debug("[SSE] User %s unsubscribed from channel %s", user_id, channel)


async def publish_notification(user_id: int, payload: dict) -> None:
    """
    Publish a notification event to the Redis channel for ``user_id``.
    Called by NotificationService.create() after persisting to DB.

    Fails silently if Redis is unavailable (non-critical path).
    """
    try:
        from app.core.redis_client import get_redis
        redis = get_redis()
        channel = _channel(user_id)
        message = json.dumps({"type": "notification", **payload})
        await redis.publish(channel, message)
        logger.debug("[SSE] Published to channel %s: %s", channel, message)
    except Exception as exc:
        logger.warning("[SSE] Failed to publish notification for user %s: %s", user_id, exc)
