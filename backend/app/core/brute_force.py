"""
Brute-force login protection backed by Redis.

Strategy
--------
- Track failed login attempts per ``ip:email`` composite key.
- **Soft lock** (5 failures): return a ``BruteForceStatus`` signalling the
  caller to add a short delay / warn the user.
- **Hard lock** (``settings.brute_force_max_attempts``): the composite key is
  locked for ``settings.brute_force_lockout_minutes`` — further attempts are
  rejected immediately without touching the DB or verifying the password.

Redis Keys
----------
- ``bf_fails:{ip}:{email_hash}`` → integer counter (24-hour TTL)
- ``bf_lock:{ip}:{email_hash}``  → "1" sentinel (lockout TTL)

Email is stored as a SHA-256 hash so raw email addresses never appear in Redis.

Usage (auth_service.py)
-----------------------
    status = await brute_force.check(ip, email)
    if status.locked:
        raise HTTPException(429, f"Too many failed attempts. Retry in {status.retry_after_seconds}s.")

    ok = verify_password(plain, hashed)
    if ok:
        await brute_force.record_success(ip, email)
    else:
        await brute_force.record_failure(ip, email)
        raise HTTPException(401, "Incorrect email or password")
"""
from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass

logger = logging.getLogger("denno.brute_force")

_FAIL_KEY_PREFIX = "bf_fails:"
_LOCK_KEY_PREFIX = "bf_lock:"
_SOFT_LOCK_THRESHOLD = 5
_COUNTER_TTL_SECONDS = 86_400  # 24 hours rolling window


def _email_hash(email: str) -> str:
    """SHA-256 of normalised email — keeps raw email out of Redis."""
    return hashlib.sha256(email.lower().strip().encode()).hexdigest()[:32]


def _keys(ip: str, email: str) -> tuple[str, str]:
    h = _email_hash(email)
    safe_ip = ip.replace(":", "_")  # IPv6 colons break some Redis patterns
    return f"{_FAIL_KEY_PREFIX}{safe_ip}:{h}", f"{_LOCK_KEY_PREFIX}{safe_ip}:{h}"


@dataclass
class BruteForceStatus:
    locked: bool
    """True when the account+IP pair is in hard lockout."""
    attempts: int
    """Number of recorded failures in the current 24-hour window."""
    soft_locked: bool
    """True when failures ≥ SOFT_LOCK_THRESHOLD but below hard-lock limit."""
    retry_after_seconds: int
    """Seconds until the hard lock expires (0 if not hard-locked)."""


async def check(ip: str, email: str) -> BruteForceStatus:
    """
    Return the current brute-force status for this IP+email pair.
    Does NOT modify any counters — call record_failure / record_success separately.
    """
    from app.core.redis_client import get_redis
    from app.core.config import settings

    fail_key, lock_key = _keys(ip, email)
    try:
        r = get_redis()
        lock_ttl_raw = await r.ttl(lock_key)
        locked = lock_ttl_raw > 0  # -2 = key missing, -1 = no TTL (shouldn't happen)
        retry_after = max(0, lock_ttl_raw) if locked else 0

        raw_count = await r.get(fail_key)
        attempts = int(raw_count) if raw_count else 0
        soft_locked = not locked and attempts >= _SOFT_LOCK_THRESHOLD

        return BruteForceStatus(
            locked=locked,
            attempts=attempts,
            soft_locked=soft_locked,
            retry_after_seconds=retry_after,
        )
    except Exception as exc:
        # Redis unavailable — fail open (don't lock users out if Redis is down)
        logger.error("BruteForce check failed (Redis unavailable): %s", exc)
        return BruteForceStatus(locked=False, attempts=0, soft_locked=False, retry_after_seconds=0)


async def record_failure(ip: str, email: str) -> int:
    """
    Increment the failure counter.  If the counter reaches
    ``settings.brute_force_max_attempts``, set a hard-lock key with the
    configured TTL and return the new count.
    """
    from app.core.redis_client import get_redis
    from app.core.config import settings

    fail_key, lock_key = _keys(ip, email)
    try:
        r = get_redis()
        count = await r.incr(fail_key)
        # Reset the rolling 24-hour window on every increment
        await r.expire(fail_key, _COUNTER_TTL_SECONDS)

        if count >= settings.brute_force_max_attempts:
            lockout_secs = settings.brute_force_lockout_minutes * 60
            await r.set(lock_key, "1", ex=lockout_secs)
            logger.warning(
                "BRUTE_FORCE | Hard lock set | ip=%s | email_hash=%s | attempts=%d | lock_secs=%d",
                ip,
                _email_hash(email),
                count,
                lockout_secs,
            )
        elif count >= _SOFT_LOCK_THRESHOLD:
            logger.warning(
                "BRUTE_FORCE | Soft lock threshold reached | ip=%s | email_hash=%s | attempts=%d",
                ip,
                _email_hash(email),
                count,
            )
        return count
    except Exception as exc:
        logger.error("BruteForce record_failure failed (Redis unavailable): %s", exc)
        return 0


async def record_success(ip: str, email: str) -> None:
    """
    Clear all failure counters for this IP+email pair on a successful login.
    Prevents lockout after a forgotten-password situation is resolved.
    """
    from app.core.redis_client import get_redis

    fail_key, lock_key = _keys(ip, email)
    try:
        r = get_redis()
        await r.delete(fail_key, lock_key)
        logger.info(
            "BRUTE_FORCE | Counters cleared on success | ip=%s | email_hash=%s",
            ip,
            _email_hash(email),
        )
    except Exception as exc:
        logger.error("BruteForce record_success failed (Redis unavailable): %s", exc)
