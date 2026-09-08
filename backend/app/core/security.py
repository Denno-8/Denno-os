"""
Password hashing and JWT helpers. Kept separate from deps.py (which only
*verifies* incoming tokens) because this module also *issues* them.

Every token now carries a `jti` (unique token ID) so a single token can be
revoked (logout) without needing to invalidate every token a user holds.
Access tokens also carry `role` so admin-only routes can check it without
a DB round-trip on every request.

Password hashing: Argon2id (memory-hard, PHC winner) via argon2-cffi.
Existing pbkdf2_sha256 hashes are transparently verified and re-hashed
to Argon2id on the user's next successful login.
"""
import uuid
from datetime import datetime, timedelta, timezone
try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
    _ph: PasswordHasher | None = PasswordHasher(time_cost=2, memory_cost=65536, parallelism=2)
except ImportError:
    _ph = None

from passlib.hash import pbkdf2_sha256
from jose import jwt, JWTError
import redis.asyncio as redis

from app.core.config import settings
from app.core.redis_client import get_redis

REVOKED_PREFIX = "revoked_token:"


def hash_password(password: str) -> str:
    """Hash password with Argon2id if available, falling back to pbkdf2_sha256."""
    if _ph is not None:
        return _ph.hash(password)
    return pbkdf2_sha256.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against either an Argon2id or legacy pbkdf2_sha256 hash."""
    if hashed.startswith("$argon2"):
        if _ph is not None:
            try:
                return _ph.verify(hashed, plain)
            except Exception:
                return False
        return False
    return pbkdf2_sha256.verify(plain, hashed)


def needs_rehash(hashed: str) -> bool:
    """Returns True if the stored hash uses a legacy algorithm or outdated Argon2 parameters."""
    if _ph is None:
        return False
    if not hashed.startswith("$argon2"):
        return True
    return _ph.check_needs_rehash(hashed)


def _create_token(subject: str, expires_delta: timedelta, token_type: str, extra: dict | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + expires_delta,
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str, role: str = "user") -> str:
    return _create_token(
        user_id,
        timedelta(minutes=settings.access_token_expire_minutes),
        "access",
        extra={"role": role},
    )


def create_refresh_token(user_id: str) -> str:
    return _create_token(
        user_id,
        timedelta(days=settings.refresh_token_expire_days),
        "refresh",
    )


def create_reset_token(user_id: str) -> str:
    """Short-lived (15 min) token for the password-reset flow."""
    return _create_token(user_id, timedelta(minutes=15), "reset")


async def revoke_token(payload_or_token: dict | str) -> None:
    """
    Blacklists a single token by its jti until its natural expiry.

    Accepts either:
    - A decoded payload dict (from get_token_payload dependency), OR
    - A raw token string — decoded internally so callers don't need to
      pass an untrusted client-supplied payload.
    """
    if isinstance(payload_or_token, str):
        try:
            payload: dict = jwt.decode(
                payload_or_token,
                settings.jwt_secret,
                algorithms=[settings.jwt_algorithm],
            )
        except Exception:
            return  # Invalid / already expired token — nothing to revoke
    else:
        payload = payload_or_token

    jti = payload.get("jti")
    exp = payload.get("exp")
    if not jti or not exp:
        return
    now = datetime.now(timezone.utc).timestamp()
    exp_ts = exp if isinstance(exp, (int, float)) else exp.timestamp()
    ttl = max(1, int(exp_ts - now))
    try:
        r = get_redis()
        await r.set(f"{REVOKED_PREFIX}{jti}", "1", ex=ttl)
    except Exception:
        # Redis is optional in local development. If it's unavailable,
        # proceed without revoking tokens so the app remains usable.
        return


async def is_token_revoked(jti: str) -> bool:
    try:
        r = get_redis()
        return bool(await r.exists(f"{REVOKED_PREFIX}{jti}"))
    except Exception:
        # If Redis is down, assume the token has not been revoked.
        return False


# ── httpOnly Cookie helpers ───────────────────────────────────────────────────

REFRESH_COOKIE_NAME = "denno_refresh_token"


def set_refresh_cookie(response, refresh_token: str) -> None:
    """
    Store the refresh token in an httpOnly cookie instead of the JSON body.

    Security properties:
    - httpOnly: JavaScript cannot read it — XSS cannot steal the refresh token.
    - SameSite=Lax: CSRF protection while allowing top-level navigations.
    - Secure: Only sent over HTTPS (enforced in production via settings.cookie_secure).
    - Path=/api/v1/auth: Scoped so the cookie is only sent to auth endpoints.

    The access token stays in the JSON body (and short-lived sessionStorage on
    the client), so the SPA can still read it to decode role/sub without a
    server round-trip.
    """
    from app.core.config import settings
    max_age = settings.refresh_token_expire_days * 86_400  # seconds
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=max_age,
        path="/api/v1/auth",
    )


def clear_refresh_cookie(response) -> None:
    """Expire the refresh-token cookie on logout."""
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/api/v1/auth",
        httponly=True,
        secure=False,  # delete_cookie works regardless of Secure flag
        samesite="lax",
    )
