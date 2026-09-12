from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.limiter import limiter
from app.core.redis_client import get_redis, close_redis
from app.database.postgresql import init_db, close_db
from app.api.router import api_router
from app.middleware.bot_shield import BotShieldMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.audit_logger import AuditLoggerMiddleware


import asyncio
import logging

logger = logging.getLogger("denno.main")

# ── Sentry error tracking ─────────────────────────────────────────────────────
# Initialised early so it captures errors during startup and in background tasks.
# Silently skipped if SENTRY_DSN is not set (local development).
if settings.sentry_dsn:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            integrations=[
                StarletteIntegration(transaction_style="endpoint"),
                FastApiIntegration(transaction_style="endpoint"),
                SqlalchemyIntegration(),
                LoggingIntegration(level=logging.WARNING, event_level=logging.ERROR),
            ],
            traces_sample_rate=settings.sentry_traces_sample_rate,
            environment=settings.app_env,
            send_default_pii=False,  # GDPR — never send personally identifiable information
        )
        logging.getLogger("denno.main").info(
            "[SENTRY] Initialised — env=%s traces_rate=%.2f",
            settings.app_env, settings.sentry_traces_sample_rate,
        )
    except ImportError:
        logging.getLogger("denno.main").warning(
            "[SENTRY] sentry-sdk not installed — skipping. "
            "Run: pip install 'sentry-sdk[fastapi,celery]'"
        )



async def _daily_job_fetch_loop():
    """Background task running inside FastAPI that fetches real jobs daily (every 24 hours)."""
    # Small initial delay to let server boot
    await asyncio.sleep(5)
    while True:
        try:
            from app.database.postgresql import async_session_factory
            if async_session_factory:
                async with async_session_factory() as session:
                    from app.services.real_job_fetcher import RealJobFetcher
                    fetcher = RealJobFetcher(session)
                    result = await fetcher.fetch_and_sync_all()
                    logger.info("Daily background job fetch completed: %s", result)
        except Exception as exc:
            logger.error("Daily background job fetch encountered error: %s", exc)

        # Sleep for 24 hours (86,400 seconds)
        await asyncio.sleep(86400)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    get_redis()  # lazily connects on first use; calling here just warms the client
    # Start daily background job fetcher loop
    bg_task = asyncio.create_task(_daily_job_fetch_loop())

    # ── Security startup confirmation ──────────────────────────────────
    logger.info("[SECURITY] Environment       : %s", settings.app_env)
    logger.info("[SECURITY] Bot Shield        : %s", "enabled" if settings.bot_shield_enabled else "DISABLED")
    logger.info("[SECURITY] Turnstile CAPTCHA : %s", "configured" if settings.turnstile_secret_key else "NOT configured (dev mode)")
    logger.info("[SECURITY] Brute-force lock  : after %d failures / %d-min lockout",
                settings.brute_force_max_attempts, settings.brute_force_lockout_minutes)
    logger.info("[SECURITY] Cookie Secure     : %s", settings.cookie_secure)
    logger.info("[SECURITY] Allowed hosts     : %s", settings.allowed_hosts)
    if settings.app_env == "production" and not settings.turnstile_secret_key:
        logger.warning("[SECURITY] WARNING: TURNSTILE_SECRET_KEY not set in production! Bot protection is DISABLED.")

    yield
    bg_task.cancel()
    await close_redis()
    await close_db()


# Disable interactive API docs in production — they expose every route, schema,
# and auth flow to anyone who hits /docs.
_docs_url = None if settings.app_env == "production" else "/docs"
_redoc_url = None if settings.app_env == "production" else "/redoc"

app = FastAPI(
    title="Denno API",
    description="Personal Career Intelligence & Automation Platform",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=_docs_url,
    redoc_url=_redoc_url,
)

# ── GZip Compression (outermost wrapper — shrinks all JSON responses) ─────────
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Bot Shield (outermost — runs first, assigns X-Request-ID) ────────────────
# Conditional: disabled via BOT_SHIELD_ENABLED=false in test environments.
if settings.bot_shield_enabled:
    app.add_middleware(BotShieldMiddleware)

# ── Security Headers (second — runs on all responses including errors) ────────
app.add_middleware(SecurityHeadersMiddleware)

# ── Trusted Hosts (blocks Host-header injection) ──────────────────────────────
# In development this allows localhost; in production set ALLOWED_HOSTS in .env.
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)

# ── Rate Limiting ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── Audit Logger ──────────────────────────────────────────────────────────────
app.add_middleware(AuditLoggerMiddleware)

# ── CORS ──────────────────────────────────────────────────────────────────────
# In production, only allow the configured FRONTEND_ORIGIN. The localhost
# regex is gated to development mode to avoid accidentally remaining open.
_extra_origins: list[str] = []
_allow_regex: str | None = None

if settings.app_env != "production":
    _extra_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
    ]
    _allow_regex = r"http://(localhost|127\.0\.0\.1)(:\d+)?"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, *_extra_origins],
    allow_origin_regex=_allow_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

app.include_router(api_router)


@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok"}


@app.get("/health/ready", tags=["System"])
async def readiness():
    """Checks that both PostgreSQL and Redis are reachable."""
    from sqlalchemy import text
    from app.database.postgresql import async_session_factory

    pg_ok = False
    redis_ok = False
    try:
        if async_session_factory is not None:
            async with async_session_factory() as session:
                await session.execute(text("SELECT 1"))
                pg_ok = True
    except Exception:
        pass
    try:
        await get_redis().ping()
        redis_ok = True
    except Exception:
        pass

    return {"postgres": pg_ok, "redis": redis_ok, "ready": pg_ok and redis_ok}
