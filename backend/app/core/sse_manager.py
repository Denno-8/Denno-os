"""
SSE (Server-Sent Events) connection manager for real-time notification push.

Architecture (in-process pub/sub — no Redis required):
  - Each active SSE connection gets its own asyncio.Queue.
  - Multiple browser tabs for the same user each have their own queue.
  - publish_notification() puts the event into every queue for that user.
  - event_stream() reads from its queue with a heartbeat timeout.

This approach works perfectly for single-instance deployments (Render free/starter).
For multi-instance/horizontal-scaled deployments, replace the queue dict with
Redis pub/sub (the previous implementation is in git history).
"""
import asyncio
import json
import logging
from collections import defaultdict
from typing import AsyncGenerator

logger = logging.getLogger("denno.sse")


# Registry: user_id → set of queues (one per active SSE connection / browser tab)
_subscribers: dict[int, set[asyncio.Queue]] = defaultdict(set)


def _subscribe(user_id: int) -> asyncio.Queue:
    """Register a new SSE connection for user_id and return its queue."""
    q: asyncio.Queue = asyncio.Queue(maxsize=100)
    _subscribers[user_id].add(q)
    logger.debug("[SSE] User %s connected (%d total connections)", user_id, len(_subscribers[user_id]))
    return q


def _unsubscribe(user_id: int, q: asyncio.Queue) -> None:
    """Remove the queue for a closed SSE connection."""
    _subscribers[user_id].discard(q)
    if not _subscribers[user_id]:
        _subscribers.pop(user_id, None)
    logger.debug("[SSE] User %s disconnected", user_id)


async def event_stream(user_id: int) -> AsyncGenerator[str, None]:
    """
    Async generator that yields SSE-formatted strings for the given user.

    Yields:
        SSE lines such as::

            data: {"type": "notification", "title": "...", "count": 3}\\n\\n

        A heartbeat comment is sent every 30 seconds to keep the connection
        alive through proxies that time out idle connections.
    """
    # Immediate "connected" event so the client knows the stream is live.
    yield f"data: {json.dumps({'type': 'connected', 'user_id': user_id})}\n\n"

    q = _subscribe(user_id)
    heartbeat_interval = 30  # seconds

    try:
        while True:
            try:
                # Block until an event arrives or the heartbeat timeout fires.
                payload = await asyncio.wait_for(q.get(), timeout=heartbeat_interval)
                yield f"data: {json.dumps(payload)}\n\n"
            except asyncio.TimeoutError:
                # No event in the last 30 s — send keepalive comment.
                # The EventSource API ignores lines starting with ':'
                yield ": heartbeat\n\n"
    except asyncio.CancelledError:
        logger.debug("[SSE] User %s stream cancelled (client disconnected)", user_id)
    finally:
        _unsubscribe(user_id, q)
        logger.debug("[SSE] User %s stream ended", user_id)


async def publish_notification(user_id: int, payload: dict) -> None:
    """
    Broadcast a notification event to all active SSE connections for user_id.

    Non-blocking: if a connection's queue is full (100 items), the event is
    silently dropped for that connection only — the notification is always
    already persisted in the DB and will appear on next REST poll/refresh.
    """
    if user_id not in _subscribers:
        return  # No active SSE connections for this user — no-op

    message = {"type": "notification", **payload}
    connections = list(_subscribers.get(user_id, set()))

    pushed = 0
    for q in connections:
        try:
            q.put_nowait(message)
            pushed += 1
        except asyncio.QueueFull:
            pass  # Client not consuming — drop this push, DB copy is safe

    if pushed:
        logger.debug("[SSE] Published to %d/%d connections for user %s", pushed, len(connections), user_id)
