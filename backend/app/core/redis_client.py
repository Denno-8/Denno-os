"""
Single shared Redis client. All code that uses Redis must handle connection
failures gracefully (Redis is optional — the app works without it).

Three real uses:
1. Token revocation (logout) — see core/security.py's revoke_token/is_token_revoked
2. Brute-force login counter — see core/brute_force.py
3. SSE pub/sub — see core/sse_manager.py

All three modules catch exceptions and fail open/silently when Redis is down.
"""
import redis.asyncio as redis
from app.core.config import settings

_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    """
    Returns a shared Redis client.

    The client is created lazily on first call. All Redis commands are
    async; the connection is NOT established until the first actual command.
    Callers MUST catch exceptions — Redis is always optional.
    """
    global _client
    if _client is None:
        url = (settings.redis_url or "redis://localhost:6379/0").strip()
        _client = redis.from_url(
            url,
            decode_responses=True,
            socket_connect_timeout=2.0,   # 2s connect timeout
            socket_timeout=2.0,           # 2s per command
            retry_on_timeout=False,
        )
    return _client


async def close_redis() -> None:
    global _client
    if _client is not None:
        await _client.close()
        _client = None
