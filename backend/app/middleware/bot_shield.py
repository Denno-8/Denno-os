"""
BotShieldMiddleware — Request ID injection + bot/scraper detection.

Responsibilities
----------------
1. **Request ID**: Assigns a UUID4 ``X-Request-ID`` to every inbound request
   and stores it in ``request.state.request_id`` so route handlers, services,
   and the audit logger can correlate log lines to a single HTTP transaction.

2. **Bot UA detection**: Blocks requests from well-known headless/scraper
   User-Agents on all non-health routes.  Returns HTTP 403 with a generic
   message so bots cannot fingerprint which rule triggered.

3. **Missing UA guard**: Auth endpoints require a non-empty User-Agent header.
   Legitimate browsers and mobile apps always send one; blank-UA requests are
   almost always automated tooling.

Middleware order (in main.py)
-----------------------------
BotShieldMiddleware should be the *outermost* middleware so the request ID
is available to every subsequent layer (including the audit logger).
"""
import re
import uuid
import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

logger = logging.getLogger("denno.bot_shield")

# ── Known scraper / headless / automated tool UA substrings ──────────────────
# Matched case-insensitively against the full User-Agent header value.
_BOT_UA_PATTERNS: list[re.Pattern] = [re.compile(p, re.IGNORECASE) for p in [
    r"python-requests",
    r"python-httpx",
    r"python-urllib",
    r"go-http-client",
    r"ruby",
    r"scrapy",
    r"aiohttp",
    r"httpclient",
    r"axios/",          # Direct axios without a browser context is a bot signal
    r"libcurl",
    r"wget",
    r"java/",
    r"okhttp",
    r"node-fetch",
    r"got/",            # Node.js `got` library
    r"undici",          # Node.js built-in HTTP
    r"mechanize",
    r"htmlunit",
    r"phantomjs",
    r"headlesschrome",  # some CI runners identify as this
    r"heritrix",
    r"facebookexternalhit",  # FB crawler — no business on auth endpoints
    r"twitterbot",
    r"linkedinbot",
    r"semrushbot",
    r"ahrefsbot",
    r"mj12bot",
    r"dotbot",
    r"petalbot",
    r"bytespider",
    r"gptbot",
    r"claudebot",
    r"anthropic-ai",
]]

# Routes where a non-empty UA is *required* (auth-sensitive endpoints).
_AUTH_PREFIX = "/api/v1/auth"

# Routes where bot UAs are blocked outright (everything except health probes).
_HEALTH_PATHS = {"/health", "/health/ready"}


class BotShieldMiddleware(BaseHTTPMiddleware):
    """
    Outermost security middleware — runs before rate limiting, auth, and CORS.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # ── 1. Assign a unique Request ID ────────────────────────────────────
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        path = request.url.path
        ua = request.headers.get("user-agent", "")

        # ── 2. Missing UA guard on auth endpoints ─────────────────────────────
        if path.startswith(_AUTH_PREFIX) and not ua.strip():
            logger.warning(
                "SHIELD | Missing User-Agent on auth endpoint | path=%s | ip=%s | rid=%s",
                path,
                _get_ip(request),
                request_id,
            )
            return _forbidden(request_id, "Request rejected")

        # ── 3. Bot UA detection (skip health probes) ──────────────────────────
        if path not in _HEALTH_PATHS and ua:
            for pattern in _BOT_UA_PATTERNS:
                if pattern.search(ua):
                    logger.warning(
                        "SHIELD | Bot UA blocked | ua=%.120s | path=%s | ip=%s | rid=%s",
                        ua,
                        path,
                        _get_ip(request),
                        request_id,
                    )
                    return _forbidden(request_id, "Request rejected")

        # ── 4. Pass through — attach request ID to response ───────────────────
        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


def _get_ip(request: Request) -> str:
    """Return the best-effort client IP (honours X-Forwarded-For from trusted proxies)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _forbidden(request_id: str, detail: str) -> JSONResponse:
    return JSONResponse(
        status_code=403,
        content={"detail": detail},
        headers={"X-Request-ID": request_id},
    )
