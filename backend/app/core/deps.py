"""
Shared FastAPI dependencies: DB handle + current-user extraction from JWT.

get_token_payload() is the base dependency — it decodes the token, checks
type/expiry, AND checks the Redis revocation blacklist (so a logged-out
token is rejected even though the JWT signature itself is still valid).
get_current_user_id() and require_admin() both build on it.
"""
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import is_token_revoked
from app.database.postgresql import get_session

bearer_scheme = HTTPBearer(auto_error=False)


async def get_token_payload(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    if payload.get("type") != "access" or not payload.get("sub"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token payload")

    jti = payload.get("jti")
    if jti and await is_token_revoked(jti):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token has been revoked")

    return payload


async def get_current_user_id(payload: dict = Depends(get_token_payload)) -> int:
    """Return current user's ID from token payload."""
    return int(payload["sub"])


async def require_admin(payload: dict = Depends(get_token_payload)) -> int:
    """
    Guards admin-only routes (company/job/course-catalog/source-management
    writes). Role is baked into the access token at login/register time —
    see core/security.py's create_access_token — so this needs no DB call.
    """
    if payload.get("role") != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return int(payload["sub"])


async def get_database() -> AsyncSession:
    """Dependency providing async database session."""
    async for session in get_session():
        yield session


async def get_request_id(request: Request) -> str:
    """
    Extract the ``X-Request-ID`` injected by BotShieldMiddleware.
    Falls back to the raw header value, then to an empty string.
    Use this in route handlers that want to correlate log lines with
    a specific incoming request.
    """
    return getattr(request.state, "request_id", request.headers.get("x-request-id", ""))


async def require_verified_email(
    payload: dict = Depends(get_token_payload),
) -> dict:
    """
    Forward-compatible dependency: currently a no-op pass-through.
    When email verification is fully implemented, uncomment the check
    and add ``email_verified`` to the JWT payload at login time.

    Guarded routes will automatically start enforcing verification
    without any additional code change at the call site.
    """
    # if not payload.get("email_verified"):
    #     raise HTTPException(status.HTTP_403_FORBIDDEN, "Email address not verified.")
    return payload
