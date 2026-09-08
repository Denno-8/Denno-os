"""
Audit Logger Middleware — comprehensive request tracing.

Logs every inbound request with:
- ``X-Request-ID`` (assigned by BotShieldMiddleware) for end-to-end correlation.
- Authenticated user ID decoded non-destructively from the JWT (no DB call).
- HTTP method, cleaned path (sensitive tokens redacted), client IP, User-Agent.
- Response status code and wall-clock latency.
- Log level: DEBUG for read-only (GET/HEAD/OPTIONS), INFO for mutations.

Sensitive query parameters (``token``, ``reset_token``, ``code``, ``state``)
are replaced with ``[REDACTED]`` before logging to prevent secrets leaking into
log aggregators.
"""
import base64
import json
import logging
import re
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

audit_logger = logging.getLogger("denno.audit")

# Query-string parameters whose values must never appear in logs.
_SENSITIVE_PARAMS = frozenset({"token", "reset_token", "code", "state", "api_key", "secret"})

# Regex matching path segments that look like JWT or UUID tokens (≥20 chars of base64url/hex).
_TOKEN_IN_PATH_RE = re.compile(r"(?<=/)[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}")


def _safe_path(request: Request) -> str:
    """Return the URL path + sanitised query string (secrets redacted)."""
    path = request.url.path
    # Redact JWT-like segments embedded in the path (e.g. /reset/eyJ...)
    path = _TOKEN_IN_PATH_RE.sub("[TOKEN]", path)

    qs = request.url.query
    if not qs:
        return path

    cleaned_parts: list[str] = []
    for part in qs.split("&"):
        if "=" in part:
            key, _, val = part.partition("=")
            if key.lower() in _SENSITIVE_PARAMS:
                cleaned_parts.append(f"{key}=[REDACTED]")
            else:
                cleaned_parts.append(part)
        else:
            cleaned_parts.append(part)
    return f"{path}?{'&'.join(cleaned_parts)}"


def _extract_user_id(request: Request) -> str:
    """
    Non-destructively decode the JWT ``sub`` claim from the Authorization header.
    Returns the user ID string, or ``"-"`` if missing/invalid.
    This never verifies the signature — that's the auth dependency's job.
    """
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return "-"
    token = auth[7:]
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return "-"
        payload_b64 = parts[1]
        # Base64url padding
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += "=" * padding
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        return str(payload.get("sub", "-"))
    except Exception:
        return "-"


class AuditLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()

        # Gather request context
        request_id = getattr(request.state, "request_id", request.headers.get("x-request-id", "-"))
        client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() \
                    or (request.client.host if request.client else "unknown")
        user_agent = request.headers.get("user-agent", "-")
        user_id = _extract_user_id(request)
        safe_path = _safe_path(request)

        response: Response = await call_next(request)

        duration_ms = round((time.time() - start_time) * 1000, 2)
        status_code = response.status_code

        log_line = (
            "AUDIT | rid=%s | %s %s | user=%s | ip=%s | status=%d | %sms | ua=%.100s"
        )
        log_args = (
            request_id,
            request.method,
            safe_path,
            user_id,
            client_ip,
            status_code,
            duration_ms,
            user_agent,
        )

        # Use INFO for mutations and error responses; DEBUG for benign reads
        if request.method in ("POST", "PUT", "PATCH", "DELETE") or status_code >= 400:
            audit_logger.info(log_line, *log_args)
        else:
            audit_logger.debug(log_line, *log_args)

        return response
