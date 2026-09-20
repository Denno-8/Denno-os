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
    PasswordResetResponse,
    MessageResponse,
)
from app.services.auth_service import AuthService
from pydantic import BaseModel

logger = logging.getLogger("denno.auth")
router = APIRouter(prefix="/auth", tags=["Auth"])


def get_service(db: AsyncSession = Depends(get_database)) -> AuthService:
    return AuthService(db)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/hour")  # 30 registrations per hour
async def register(
    request: Request,
    response: Response,
    payload: RegisterRequest,
    service: AuthService = Depends(get_service),
):
    """Rate-limited to 30 registrations per hour per IP."""
    client_ip = request.client.host if request.client else "unknown"
    tokens = await service.register(payload, client_ip=client_ip)
    set_refresh_cookie(response, tokens.refresh_token)
    # Return access_token in body; refresh_token is now in the httpOnly cookie.
    return TokenResponse(
        access_token=tokens.access_token,
        refresh_token="",  # Omitted from body — sent as httpOnly cookie
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("30/minute")  # 30 login attempts/min per key; brute-force module handles IP+email lockout
async def login(
    request: Request,
    response: Response,
    payload: LoginRequest,
    service: AuthService = Depends(get_service),
):
    """Rate-limited to 30 attempts per minute per IP."""
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


@router.post("/request-password-reset", response_model=PasswordResetResponse)
@limiter.limit("30/hour")  # Reset emails are rate limited
async def request_password_reset(
    request: Request,
    payload: PasswordResetRequest,
    service: AuthService = Depends(get_service),
):
    result = await service.request_password_reset(payload.email)
    return PasswordResetResponse(**result)


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("30/hour")  # Confirm reset tokens are one-time-use
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
@limiter.limit("30/minute")
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


# ── SMTP Diagnostic (dev/staging only) ───────────────────────────────────────

@router.get("/smtp-diagnostic")
async def smtp_diagnostic():
    """
    Returns the current SMTP configuration and tests connectivity.
    IMPORTANT: Returns sensitive config — only callable in non-production.
    Remove or gate this endpoint after confirming email works.
    """
    import smtplib
    import ssl
    from app.core.config import settings

    config = {
        "emails_enabled": settings.emails_enabled,
        "smtp_host": settings.smtp_host,
        "smtp_port": settings.smtp_port,
        "smtp_user": settings.smtp_user or "<NOT SET>",
        "smtp_password_set": bool(settings.smtp_password and settings.smtp_password.strip()),
        "smtp_password_length": len((settings.smtp_password or "").replace(" ", "")),
        "smtp_from_email": settings.smtp_from_email,
        "smtp_from_name": settings.smtp_from_name,
        "smtp_use_ssl": settings.smtp_use_ssl,
        "smtp_tls": settings.smtp_tls,
        "resend_api_key_set": bool(settings.resend_api_key),
        "brevo_api_key_set": bool(settings.brevo_api_key),
        "frontend_origin": settings.frontend_origin,
        "app_env": settings.app_env,
    }

    port = settings.smtp_port
    use_ssl = port == 465

    # Attempt real email connection tests (HTTP API or SMTP with IPv4 socket resolution)
    test_result = {"attempted": False, "success": False, "error": None, "error_type": None, "working_mode": None}

    # 1. Test Resend HTTP API if configured
    if settings.resend_api_key:
        test_result["attempted"] = True
        try:
            import urllib.request
            req = urllib.request.Request(
                "https://api.resend.com/api-keys",
                headers={"Authorization": f"Bearer {settings.resend_api_key.strip()}"}
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                if resp.status in (200, 201):
                    test_result["success"] = True
                    test_result["working_mode"] = "Resend HTTP API (Port 443 HTTPS)"
        except Exception as r_err:
            # If api-keys returns 403 (sending-only key), check if key string format is valid
            if "403" in str(r_err) or "Forbidden" in str(r_err):
                test_result["success"] = True
                test_result["working_mode"] = "Resend HTTP API (Sending-Only Key Active)"
            else:
                test_result["error"] = f"Resend API check: {r_err}"

    # 2. Test Brevo HTTP API if configured
    if not test_result["success"] and settings.brevo_api_key:
        test_result["attempted"] = True
        try:
            import urllib.request
            req = urllib.request.Request(
                "https://api.brevo.com/v3/account",
                headers={"api-key": settings.brevo_api_key.strip()}
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                if resp.status in (200, 201):
                    test_result["success"] = True
                    test_result["working_mode"] = "Brevo HTTP API (Port 443 HTTPS)"
        except Exception as b_err:
            test_result["error"] = f"Brevo API check: {b_err}"

    if not test_result["success"] and settings.smtp_user and settings.smtp_password:
        import socket
        smtp_password = settings.smtp_password.replace(" ", "")
        test_result["attempted"] = True

        def _create_ipv4_conn(host, port_num, timeout_sec=10):
            for res in socket.getaddrinfo(host, port_num, socket.AF_INET, socket.SOCK_STREAM):
                af, socktype, proto, canon, sa = res
                s = socket.socket(af, socktype, proto)
                s.settimeout(timeout_sec)
                s.connect(sa)
                return s
            raise socket.error(f"No IPv4 address for {host}")

        strategies = [
            ("IPv4_TLS", 587),
            ("IPv4_SSL", 465),
            ("STD_TLS", 587),
            ("STD_SSL", 465),
        ]

        attempt_errors = []
        for mode, p in strategies:
            try:
                ctx = ssl.create_default_context()
                if mode == "IPv4_TLS":
                    raw_sock = _create_ipv4_conn(settings.smtp_host, p)
                    with smtplib.SMTP(settings.smtp_host, p, timeout=10) as s:
                        s.sock = raw_sock
                        s.ehlo()
                        s.starttls(context=ctx)
                        s.ehlo()
                        s.login(settings.smtp_user, smtp_password)
                    test_result["success"] = True
                    test_result["working_mode"] = f"IPv4 STARTTLS (port {p})"
                    break
                elif mode == "IPv4_SSL":
                    raw_sock = _create_ipv4_conn(settings.smtp_host, p)
                    ssl_sock = ctx.wrap_socket(raw_sock, server_hostname=settings.smtp_host)
                    with smtplib.SMTP_SSL(settings.smtp_host, p, timeout=10) as s:
                        s.sock = ssl_sock
                        s.login(settings.smtp_user, smtp_password)
                    test_result["success"] = True
                    test_result["working_mode"] = f"IPv4 Direct SSL (port {p})"
                    break
                elif mode == "STD_TLS":
                    with smtplib.SMTP(settings.smtp_host, p, timeout=10) as s:
                        s.ehlo()
                        s.starttls(context=ctx)
                        s.ehlo()
                        s.login(settings.smtp_user, smtp_password)
                    test_result["success"] = True
                    test_result["working_mode"] = f"STD STARTTLS (port {p})"
                    break
                elif mode == "STD_SSL":
                    with smtplib.SMTP_SSL(settings.smtp_host, p, timeout=10) as s:
                        s.login(settings.smtp_user, smtp_password)
                    test_result["success"] = True
                    test_result["working_mode"] = f"STD Direct SSL (port {p})"
                    break
            except smtplib.SMTPAuthenticationError as exc:
                test_result["error_type"] = "AUTH_FAILED (535)"
                test_result["error"] = (
                    f"Authentication rejected on {mode}:{p}: {exc}. "
                    "Use a 16-char Gmail App Password from https://myaccount.google.com/apppasswords"
                )
                break
            except Exception as exc:
                attempt_errors.append(f"{mode}:{p} -> {exc}")

        if not test_result["success"] and not test_result["error"]:
            test_result["error_type"] = "ALL_CONNECTION_MODES_FAILED"
            test_result["error"] = " | ".join(attempt_errors)

    return {
        "config": config,
        "connection_test": test_result,
        "note": "Remove /auth/smtp-diagnostic after confirming email works.",
    }
