import logging
from typing import Optional
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user_id, get_database, get_token_payload
from app.core.limiter import limiter
from app.core.security import (
    create_access_token,
    create_refresh_token,
    revoke_token,
    set_refresh_cookie,
    clear_refresh_cookie,
    REFRESH_COOKIE_NAME,
)
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    UserOut,
    UserProfileUpdate,
    ChangePasswordRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    MessageResponse,
)
from app.services.auth_service import AuthService
from pydantic import BaseModel

logger = logging.getLogger("denno.auth")
router = APIRouter(prefix="/auth", tags=["Auth"])


def get_service(db: AsyncSession = Depends(get_database)) -> AuthService:
    return AuthService(db)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")  # Registrations are once-per-user; 5/hour stops bulk account creation
async def register(
    request: Request,
    response: Response,
    payload: RegisterRequest,
    service: AuthService = Depends(get_service),
):
    """Rate-limited to 10 registrations per minute per IP."""
    client_ip = request.client.host if request.client else "unknown"
    tokens = await service.register(payload, client_ip=client_ip)
    set_refresh_cookie(response, tokens.refresh_token)
    # Return access_token in body; refresh_token is now in the httpOnly cookie.
    return TokenResponse(
        access_token=tokens.access_token,
        refresh_token="",  # Omitted from body — sent as httpOnly cookie
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("3/minute")  # 3 attempts/min per key; brute-force module adds IP+email lockout
async def login(
    request: Request,
    response: Response,
    payload: LoginRequest,
    service: AuthService = Depends(get_service),
):
    """Rate-limited to 5 attempts per minute per IP to block credential stuffing."""
    client_ip = request.client.host if request.client else "unknown"
    tokens = await service.login(payload, client_ip=client_ip)
    set_refresh_cookie(response, tokens.refresh_token)
    return TokenResponse(
        access_token=tokens.access_token,
        refresh_token="",  # Omitted from body — sent as httpOnly cookie
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("30/minute")
async def refresh(
    request: Request,
    response: Response,
    # Read from httpOnly cookie first; fall back to body for backward compatibility.
    cookie_token: Optional[str] = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    body: Optional[RefreshRequest] = None,
    service: AuthService = Depends(get_service),
):
    raw_token = cookie_token or (body.refresh_token if body else None)
    if not raw_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token required")

    try:
        decoded = jwt.decode(raw_token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        if decoded.get("type") != "refresh":
            raise ValueError("Not a refresh token")
        user_id = decoded["sub"]
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")

    # Revoke the old refresh token (rotation — one-time use).
    await revoke_token(decoded)

    # Fetch actual role from DB so admin role changes take effect on next refresh.
    user = await service.me(int(user_id))
    role = user.role if hasattr(user, "role") else (user.get("role") if isinstance(user, dict) else "user")

    new_access = create_access_token(user_id, role=role or "user")
    new_refresh = create_refresh_token(user_id)
    set_refresh_cookie(response, new_refresh)
    return TokenResponse(access_token=new_access, refresh_token="")


@router.get("/me", response_model=UserOut)
@limiter.limit("60/minute")
async def me(
    request: Request,
    user_id: str = Depends(get_current_user_id),
    service: AuthService = Depends(get_service),
):
    return await service.me(user_id)


class LogoutRequest(BaseModel):
    """Optional refresh_token to revoke alongside the access token (legacy / non-cookie clients)."""
    refresh_token: Optional[str] = None


@router.post("/logout", response_model=MessageResponse)
@limiter.limit("20/minute")
async def logout(
    request: Request,
    response: Response,
    body: LogoutRequest,
    payload: dict = Depends(get_token_payload),
    # Read refresh token from cookie (preferred) or body (legacy fallback).
    cookie_token: Optional[str] = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    service: AuthService = Depends(get_service),
):
    """Revokes the access token and the refresh token, then clears the httpOnly cookie."""
    client_ip = request.client.host if request.client else "unknown"
    user_id = payload.get("sub")
    logger.info("User logout requested: user_id=%s from IP=%s", user_id, client_ip)

    # Revoke the access token (already decoded by the dependency).
    await revoke_token(payload)

    # Revoke refresh token — prefer cookie, fall back to body.
    refresh_raw = cookie_token or body.refresh_token
    if refresh_raw:
        await revoke_token(refresh_raw)  # decoded internally

    # Expire the httpOnly cookie.
    clear_refresh_cookie(response)
    return MessageResponse(message="Logged out")


@router.post("/request-password-reset", response_model=MessageResponse)
@limiter.limit("3/hour")  # Low-cadence limit — reset emails are expensive and easily abused
async def request_password_reset(
    request: Request,
    payload: PasswordResetRequest,
    service: AuthService = Depends(get_service),
):
    await service.request_password_reset(payload.email)
    # Always the same response whether or not the email exists — prevents
    # email enumeration attacks.
    return MessageResponse(message="If that email exists, a reset link has been sent.")


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("3/hour")  # Confirm reset tokens are one-time-use; 3/hour prevents token bruteforce
async def reset_password(
    request: Request,
    payload: PasswordResetConfirm,
    service: AuthService = Depends(get_service),
):
    await service.confirm_password_reset(payload.token, payload.new_password)
    return MessageResponse(message="Password updated. Please log in again.")


@router.patch("/profile", response_model=UserOut)
@limiter.limit("30/minute")
async def update_profile(
    request: Request,
    payload: UserProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    service: AuthService = Depends(get_service),
):
    patch = payload.model_dump(exclude_none=True)
    return await service.update_profile(int(user_id), patch)


@router.post("/change-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def change_password(
    request: Request,
    payload: ChangePasswordRequest,
    user_id: str = Depends(get_current_user_id),
    service: AuthService = Depends(get_service),
):
    await service.change_password(int(user_id), payload.current_password, payload.new_password)
    return MessageResponse(message="Password changed successfully.")


@router.get("/linkedin/login")
async def linkedin_login(
    response: Response,
    service: AuthService = Depends(get_service),
):
    """Redirect user to LinkedIn OAuth consent screen (or perform instant demo OAuth login if LINKEDIN_CLIENT_ID is unconfigured)."""
    from fastapi.responses import RedirectResponse
    if not settings.linkedin_client_id:
        tokens = await service.get_or_create_oauth_user(
            email="linkedin.user@denno.ai",
            first_name="LinkedIn",
            last_name="User",
        )
        set_refresh_cookie(response, tokens.refresh_token)
        frontend_redirect = f"{settings.frontend_origin}/auth/linkedin/callback?token={tokens.access_token}"
        return RedirectResponse(frontend_redirect)

    redirect_uri = f"{settings.frontend_origin}/auth/linkedin/callback"
    url = (
        f"https://www.linkedin.com/oauth/v2/authorization?"
        f"response_type=code&"
        f"client_id={settings.linkedin_client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope=openid%20profile%20email"
    )
    return RedirectResponse(url)


@router.get("/linkedin/callback")
async def linkedin_callback(
    code: str,
    response: Response,
    service: AuthService = Depends(get_service),
):
    """Callback route that exchanges LinkedIn code for JWT session."""
    from fastapi.responses import RedirectResponse
    tokens = await service.authenticate_linkedin(code)
    set_refresh_cookie(response, tokens.refresh_token)
    frontend_redirect = f"{settings.frontend_origin}/auth/linkedin/callback?token={tokens.access_token}"
    return RedirectResponse(frontend_redirect)


@router.get("/google/login")
async def google_login(
    response: Response,
    service: AuthService = Depends(get_service),
):
    """Redirect user to Google OAuth consent screen (or perform instant demo OAuth login if GOOGLE_CLIENT_ID is unconfigured)."""
    from fastapi.responses import RedirectResponse
    if not settings.google_client_id:
        tokens = await service.get_or_create_oauth_user(
            email="google.user@denno.ai",
            first_name="Google",
            last_name="User",
        )
        set_refresh_cookie(response, tokens.refresh_token)
        frontend_redirect = f"{settings.frontend_origin}/auth/google/callback?token={tokens.access_token}"
        return RedirectResponse(frontend_redirect)

    redirect_uri = f"{settings.frontend_origin}/auth/google/callback"
    scope = "openid%20email%20profile"
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"response_type=code&"
        f"client_id={settings.google_client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope={scope}&"
        f"access_type=offline&"
        f"prompt=select_account"
    )
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(
    code: str,
    response: Response,
    service: AuthService = Depends(get_service),
):
    """Callback route that exchanges Google code for JWT session."""
    from fastapi.responses import RedirectResponse
    tokens = await service.authenticate_google(code)
    set_refresh_cookie(response, tokens.refresh_token)
    frontend_redirect = f"{settings.frontend_origin}/auth/google/callback?token={tokens.access_token}"
    return RedirectResponse(frontend_redirect)


@router.get("/github/login")
async def github_login(
    response: Response,
    service: AuthService = Depends(get_service),
):
    """Redirect user to GitHub OAuth consent screen (or demo login if GITHUB_CLIENT_ID is unconfigured)."""
    from fastapi.responses import RedirectResponse
    if not settings.github_client_id:
        tokens = await service.get_or_create_oauth_user(
            email="github.user@denno.ai",
            first_name="GitHub",
            last_name="User",
        )
        set_refresh_cookie(response, tokens.refresh_token)
        frontend_redirect = f"{settings.frontend_origin}/auth/github/callback?token={tokens.access_token}"
        return RedirectResponse(frontend_redirect)

    redirect_uri = f"{settings.frontend_origin}/auth/github/callback"
    url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={settings.github_client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"scope=user:email"
    )
    return RedirectResponse(url)


@router.get("/github/callback")
async def github_callback(
    code: str,
    response: Response,
    service: AuthService = Depends(get_service),
):
    """Callback route that exchanges GitHub code for JWT session."""
    from fastapi.responses import RedirectResponse
    tokens = await service.authenticate_github(code)
    set_refresh_cookie(response, tokens.refresh_token)
    frontend_redirect = f"{settings.frontend_origin}/auth/github/callback?token={tokens.access_token}"
    return RedirectResponse(frontend_redirect)
