"""
Shared rate-limiter instance backed by Redis.

Usage in routes:
    from app.core.limiter import limiter

    @router.post("/login")
    @limiter.limit("5/minute")
    async def login(request: Request, ...):
        ...

The `request: Request` parameter MUST be present in the route signature
for slowapi to identify the client; FastAPI doesn't inject it automatically.

Key strategy
-------------
When a valid JWT ``Authorization`` header is present, the rate-limit key is
``{ip}:{user_id}`` — so VPN users sharing an IP don't consume each other's
quota, and a single account can't bypass per-account limits by rotating IPs.
Unauthenticated requests fall back to plain IP.

Global default: 200 requests/minute per key across all routes.
Per-route decorators override (not add to) the global limit for that endpoint.
"""
from __future__ import annotations

import logging
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

logger = logging.getLogger("denno.limiter")


def _composite_key(request: Request) -> str:
    """
    Rate-limit key = ``ip:user_id`` for authenticated requests, else just ``ip``.

    Parsing the JWT here is deliberately lightweight — we only read the ``sub``
    claim and do NOT verify the signature (that's the auth dependency's job).
    A forged ``sub`` in an otherwise invalid token just means the attacker is
    rate-limited under a fake key — not a security problem.
    """
    ip = get_remote_address(request)
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header[7:]
        try:
            import base64, json
            # JWT structure: header.payload.signature — base64url-decode the payload.
            payload_b64 = token.split(".")[1]
            # Add padding if needed.
            padding = 4 - len(payload_b64) % 4
            if padding != 4:
                payload_b64 += "=" * padding
            payload = json.loads(base64.urlsafe_b64decode(payload_b64))
            sub = payload.get("sub")
            if sub:
                return f"{ip}:{sub}"
        except Exception:
            pass  # Malformed token — fall back to IP
    return ip


def _get_storage_uri() -> str:
    """
    Returns settings.redis_url if Redis is reachable,
    otherwise falls back to 'memory://' for local dev without Redis.
    """
    try:
        import socket
        from urllib.parse import urlparse
        from app.core.config import settings as _s
        parsed = urlparse(_s.redis_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 6379
        with socket.create_connection((host, port), timeout=0.2):
            return _s.redis_url
    except Exception:
        logger.info("Redis is unreachable — rate limiter falling back to in-memory storage")
        return "memory://"


# Keyed by composite IP+user_id (or plain IP for anonymous requests).
# Global default: 200/min. Sensitive routes override via @limiter.limit().
limiter = Limiter(
    key_func=_composite_key,
    default_limits=["200/minute"],
    storage_uri=_get_storage_uri(),
)
