"""
/health/metrics — lightweight Prometheus-compatible metrics endpoint.

Exposes key runtime counters and gauges without requiring a full
prometheus-client installation. Format: plain text Prometheus exposition.

Secured to avoid leaking infra details to the public — call with an
internal Bearer token or only expose to your monitoring network.
"""
import time
import asyncio
import os
import sys
import platform
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse

from app.core.config import settings
from app.core.redis_client import get_redis
from app.database.postgresql import async_session_factory

router = APIRouter(prefix="/health", tags=["System"])

# ── Process start time (for uptime calculation) ────────────────────────────────
_START_TIME = time.time()


def _require_metrics_key(
    authorization: str | None = None,
) -> None:
    """
    Simple bearer-token guard.
    Set METRICS_SECRET_KEY in your env to enable. If not set, metrics are
    only accessible from localhost (enforced at Nginx level — see nginx.conf).
    """
    metrics_key = os.getenv("METRICS_SECRET_KEY", "")
    if not metrics_key:
        return  # open if no key configured (rely on network ACL instead)
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing metrics token")
    token = authorization.removeprefix("Bearer ").strip()
    if token != metrics_key:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid metrics token")


def _prometheus_line(name: str, value: float | int, help_text: str = "", metric_type: str = "gauge", labels: dict | None = None) -> str:
    label_str = ""
    if labels:
        parts = ",".join(f'{k}="{v}"' for k, v in labels.items())
        label_str = f"{{{parts}}}"
    lines = []
    if help_text:
        lines.append(f"# HELP {name} {help_text}")
    if metric_type:
        lines.append(f"# TYPE {name} {metric_type}")
    lines.append(f"{name}{label_str} {value}")
    return "\n".join(lines)


@router.get(
    "/metrics",
    response_class=PlainTextResponse,
    summary="Prometheus-compatible metrics",
    description="Exposes runtime metrics in Prometheus text format. Secure with METRICS_SECRET_KEY env var.",
    include_in_schema=settings.app_env != "production",  # hidden from Swagger in production
)
async def metrics_endpoint(authorization: str | None = None) -> str:
    _require_metrics_key(authorization)

    lines: list[str] = []
    uptime_seconds = time.time() - _START_TIME

    # ── Runtime info ───────────────────────────────────────────────────────────
    lines.append(_prometheus_line(
        "denno_info", 1,
        help_text="Denno application build info",
        metric_type="gauge",
        labels={
            "version": "1.0.0",
            "python": platform.python_version(),
            "env": settings.app_env,
        }
    ))
    lines.append("")

    lines.append(_prometheus_line(
        "denno_uptime_seconds",
        round(uptime_seconds, 2),
        help_text="Process uptime in seconds",
        metric_type="gauge",
    ))
    lines.append("")

    lines.append(_prometheus_line(
        "denno_process_start_time_seconds",
        round(_START_TIME, 3),
        help_text="Unix timestamp when the process started",
        metric_type="gauge",
    ))
    lines.append("")

    # ── Database health ────────────────────────────────────────────────────────
    pg_up = 0
    pg_latency_ms = -1.0
    try:
        if async_session_factory is not None:
            from sqlalchemy import text
            t0 = time.monotonic()
            async with async_session_factory() as session:
                await session.execute(text("SELECT 1"))
            pg_latency_ms = round((time.monotonic() - t0) * 1000, 2)
            pg_up = 1
    except Exception:
        pass

    lines.append(_prometheus_line("denno_postgres_up", pg_up, "1 if PostgreSQL is reachable", "gauge"))
    lines.append("")
    lines.append(_prometheus_line("denno_postgres_latency_ms", pg_latency_ms, "PostgreSQL round-trip latency in milliseconds", "gauge"))
    lines.append("")

    # ── Redis health ───────────────────────────────────────────────────────────
    redis_up = 0
    redis_latency_ms = -1.0
    redis_used_memory_bytes = -1
    try:
        redis = get_redis()
        t0 = time.monotonic()
        await redis.ping()
        redis_latency_ms = round((time.monotonic() - t0) * 1000, 2)
        redis_up = 1
        info = await redis.info("memory")
        redis_used_memory_bytes = info.get("used_memory", -1)
    except Exception:
        pass

    lines.append(_prometheus_line("denno_redis_up", redis_up, "1 if Redis is reachable", "gauge"))
    lines.append("")
    lines.append(_prometheus_line("denno_redis_latency_ms", redis_latency_ms, "Redis round-trip latency in milliseconds", "gauge"))
    lines.append("")
    lines.append(_prometheus_line("denno_redis_used_memory_bytes", redis_used_memory_bytes, "Redis used memory in bytes", "gauge"))
    lines.append("")

    # ── Process memory (via /proc or psutil if available) ─────────────────────
    rss_bytes = -1
    try:
        import resource
        rss_bytes = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024
    except ImportError:
        try:
            import psutil
            proc = psutil.Process(os.getpid())
            rss_bytes = proc.memory_info().rss
        except ImportError:
            pass

    lines.append(_prometheus_line("denno_process_resident_memory_bytes", rss_bytes, "Process RSS memory usage in bytes", "gauge"))
    lines.append("")

    # ── Asyncio event loop stats ───────────────────────────────────────────────
    loop = asyncio.get_event_loop()
    pending_tasks = len([t for t in asyncio.all_tasks(loop) if not t.done()])
    lines.append(_prometheus_line("denno_asyncio_pending_tasks", pending_tasks, "Number of pending asyncio tasks", "gauge"))
    lines.append("")

    return "\n".join(lines) + "\n"
