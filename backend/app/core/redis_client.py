"""
Single shared Redis client. Previously configured via local service setup
but never actually used anywhere — this wires it in for three real purposes:
1. Token revocation (logout) — see core/security.py's revoke_token/is_token_revoked
2. Short-TTL response caching on hot GET endpoints (jobs, companies search)
3. Celery broker/result backend (see core/celery_app.py)
"""
import redis.asyncio as redis
from app.core.config import settings

_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=0.5,
            socket_timeout=0.5,
        )
    return _client



async def close_redis() -> None:
    global _client
    if _client is not None:
        await _client.close()
        _client = None
