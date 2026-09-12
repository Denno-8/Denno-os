import logging
from fastapi import HTTPException, status
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core import brute_force as bf
from app.core.security import (
    hash_password,
    verify_password,
    needs_rehash,
    create_access_token,
    create_refresh_token,
    create_reset_token,
)
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut

logger = logging.getLogger("denno.auth")


def _serialize_user(user) -> UserOut:
    return UserOut(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name or "",
        last_name=user.last_name or "",
        title=user.title or "",
        location=user.location or "",
        phone=user.phone or "",
        years_experience=user.years_experience or 0,
        linkedin=user.linkedin or "",
        github=user.github or "",
        website=user.website or "",
        summary=user.summary or "",
        career_goal=user.career_goal or "",
        availability=user.availability or "Immediately",
        notice_period=user.notice_period or "1 month",
        salary_min=user.salary_min or 0,
        salary_max=user.salary_max or 0,
        currency=user.currency or "KES",
        skills=user.skills or [],
        notifications=user.notifications or {},
        theme=user.theme or "light",
        two_fa_enabled=getattr(user, "two_fa_enabled", False),
        profile_public=getattr(user, "profile_public", False),
        role=user.role or "user",
    )


class AuthService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def _verify_turnstile(
        self,
        token: str | None,
        client_ip: str = "unknown",
        action: str = "register",
    ) -> None:
        """
        Verify a Cloudflare Turnstile token with action binding.

        The ``action`` parameter must match the ``action`` the Turnstile widget
        was rendered with on the frontend (e.g. ``"login"`` or ``"register"``).
        This prevents a token issued for one action being replayed on another.

        If ``TURNSTILE_SECRET_KEY`` is not set, the check is skipped entirely
        (safe for local development without a Turnstile site configured).
        """
        secret_key = settings.turnstile_secret_key
        if not secret_key:
            # Bot protection disabled / not configured (e.g. local dev)
            return

        if not token:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"CAPTCHA verification required for {action}",
            )

        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                    data={
                        "secret": secret_key,
                        "response": token,
                        "remoteip": client_ip,
                    },
                )
                outcome = res.json()
                if not outcome.get("success", False):
                    logger.warning(
                        "Turnstile bot verification failed | action=%s | ip=%s | errors=%s",
                        action,
                        client_ip,
                        outcome.get("error-codes"),
                    )
                    raise HTTPException(
                        status.HTTP_400_BAD_REQUEST,
                        "Bot check failed. Please try again.",
                    )
                # Verify action binding when the widget returns it
                returned_action = outcome.get("action", "")
                if returned_action and returned_action != action:
                    logger.warning(
                        "Turnstile action mismatch | expected=%s | got=%s | ip=%s",
                        action,
                        returned_action,
                        client_ip,
                    )
                    raise HTTPException(
                        status.HTTP_400_BAD_REQUEST,
                        "Bot check failed. Please try again.",
                    )
        except HTTPException:
            raise
        except Exception as exc:
            logger.error("Turnstile API call failed: %s", exc)
            # Fail closed in production if key is set
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Bot protection service temporarily unavailable",
            )

    async def register(self, payload: RegisterRequest, client_ip: str = "unknown") -> TokenResponse:
        await self._verify_turnstile(payload.turnstile_token, client_ip, action="register")

        existing = await self.repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

        doc = {
            "email": payload.email,
            "password_hash": hash_password(payload.password),
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "role": "user",
        }
        created = await self.repo.create(doc)
        user_id = str(created.id)
        return TokenResponse(
            access_token=create_access_token(user_id, role="user"),
            refresh_token=create_refresh_token(user_id),
        )


    async def login(self, payload: LoginRequest, client_ip: str = "unknown") -> TokenResponse:
        # ── Bot protection ────────────────────────────────────────────────────
        await self._verify_turnstile(
            getattr(payload, "turnstile_token", None),
            client_ip,
            action="login",
        )

        # ── Brute-force check BEFORE any DB query ─────────────────────────────
        # This stops dictionary attacks even before we know if the user exists.
        bf_status = await bf.check(client_ip, payload.email)
        if bf_status.locked:
            logger.warning(
                "Login blocked by brute-force lockout | ip=%s | retry_after=%ds",
                client_ip,
                bf_status.retry_after_seconds,
            )
            from fastapi.responses import JSONResponse
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Too many failed login attempts. "
                    f"Please wait {bf_status.retry_after_seconds} seconds before trying again."
                ),
                headers={"Retry-After": str(bf_status.retry_after_seconds)},
            )

        user = await self.repo.get_by_email(payload.email)
        if not user:
            # Record failure even for non-existent users — prevents email enumeration
            # through timing differences between "user not found" and "wrong password".
            await bf.record_failure(client_ip, payload.email)
            logger.warning(
                "Login failed: no account | ip=%s | email_hash=%s",
                client_ip,
                hash(payload.email),
            )
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")

        if getattr(user, "is_active", True) is False:
            logger.warning(
                "Login blocked: suspended account | user_id=%s | ip=%s",
                user.id,
                client_ip,
            )
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Account suspended. Please contact support.")

        is_valid = verify_password(payload.password, user.password_hash)
        if not is_valid:
            count = await bf.record_failure(client_ip, payload.email)
            logger.warning(
                "Login failed: invalid password | user_id=%s | ip=%s | bf_attempts=%d",
                user.id,
                client_ip,
                count,
            )
            # Provide a soft-lock hint when approaching the hard-lock threshold
            bf_status_after = await bf.check(client_ip, payload.email)
            if bf_status_after.soft_locked:
                remaining = settings.brute_force_max_attempts - bf_status_after.attempts
                raise HTTPException(
                    status.HTTP_401_UNAUTHORIZED,
                    f"Incorrect email or password. "
                    f"{remaining} attempt(s) remaining before temporary lockout.",
                )
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")

        # ── Successful login — clear failure counters ─────────────────────────
        await bf.record_success(client_ip, payload.email)
        logger.info("Login successful | user_id=%s | ip=%s", user.id, client_ip)

        # Transparent migration: re-hash legacy pbkdf2 passwords to Argon2id
        # on first successful login. User notices nothing; security improves silently.
        if needs_rehash(user.password_hash):
            try:
                await self.repo.update_password(user.id, hash_password(payload.password))
                logger.info("Rehashed password to Argon2id for user_id=%s", user.id)
            except Exception:
                pass  # Non-fatal — the login still succeeds

        user_id = str(user.id)
        role = user.role or "user"
        return TokenResponse(
            access_token=create_access_token(user_id, role=role),
            refresh_token=create_refresh_token(user_id),
        )

    async def me(self, user_id: int) -> UserOut:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
        return _serialize_user(user)

    async def request_password_reset(self, email: str) -> None:
        user = await self.repo.get_by_email(email)
        if not user:
            return
        token = create_reset_token(str(user.id))
        logger.info("Password reset token issued for user_id=%s", user.id)
        # Send the reset link via email (no-op if SMTP is not configured)
        try:
            from app.core.email_sender import send_password_reset
            first_name = getattr(user, "first_name", "") or ""
            reset_link = f"{__import__('app.core.config', fromlist=['settings']).settings.frontend_origin}/reset-password?token={token}"
            await send_password_reset(user.email, token, first_name)
            logger.info("Password reset email dispatched for user_id=%s", user.id)
        except Exception as exc:
            logger.error("Failed to send password reset email for user_id=%s: %s", user.id, exc)

    async def confirm_password_reset(self, token: str, new_password: str) -> None:
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
            if payload.get("type") != "reset":
                raise ValueError("Not a reset token")
            user_id = int(payload["sub"])
        except (JWTError, KeyError, ValueError):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset token")

        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

        await self.repo.update_password(user_id, hash_password(new_password))

    async def update_profile(self, user_id: int, payload: dict) -> UserOut:
        if "email" in payload and payload["email"]:
            new_email = payload["email"].lower().strip()
            payload["email"] = new_email
            existing = await self.repo.get_by_email(new_email)
            if existing and existing.id != user_id:
                raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

        updated = await self.repo.update(user_id, payload)
        if not updated:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
        return _serialize_user(updated)

    async def change_password(self, user_id: int, current_password: str, new_password: str) -> None:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

        if not verify_password(current_password, user.password_hash):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")

        await self.repo.update_password(user_id, hash_password(new_password))

    async def authenticate_google(self, code: str) -> TokenResponse:
        """Exchange a Google OAuth authorization code for a Denno session."""
        import uuid
        import httpx

        if not settings.google_client_id or not settings.google_client_secret:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Google OAuth credentials are not configured in backend .env",
            )

        redirect_uri = f"{settings.frontend_origin}/auth/google/callback"
        async with httpx.AsyncClient(timeout=10.0) as client:
            # 1. Exchange code for tokens
            token_res = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if token_res.status_code != 200:
                logger.error("Google token exchange failed: %s", token_res.text)
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    "Failed to exchange authorization code with Google",
                )
            google_tokens = token_res.json()
            g_access_token = google_tokens.get("access_token")
            if not g_access_token:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid token response from Google")

            # 2. Fetch user profile
            profile_res = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {g_access_token}"},
            )
            if profile_res.status_code != 200:
                logger.error("Google userinfo failed: %s", profile_res.text)
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Failed to fetch profile from Google")

            user_data = profile_res.json()
            email = user_data.get("email")
            first_name = user_data.get("given_name") or user_data.get("name", "").split(" ")[0]
            last_name = user_data.get("family_name") or ""
            sub = user_data.get("sub") or ""
            email_verified = user_data.get("email_verified", False)

            if not email:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google account has no public email address")
            if not email_verified:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google email address is not verified")

            existing = await self.repo.get_by_email(email)
            if existing:
                user = existing
            else:
                user_doc = {
                    "email": email,
                    "password_hash": hash_password(str(uuid.uuid4())),
                    "first_name": first_name,
                    "last_name": last_name,
                    "role": "user",
                }
                user = await self.repo.create(user_doc)

            user_id = str(user.id)
            role = user.role or "user"
            return TokenResponse(
                access_token=create_access_token(user_id, role=role),
                refresh_token=create_refresh_token(user_id),
            )

    async def get_or_create_oauth_user(self, email: str, first_name: str, last_name: str) -> TokenResponse:
        """Helper to retrieve or create a user for OAuth logins (including dev demo logins)."""
        import uuid
        existing = await self.repo.get_by_email(email)
        if existing:
            user = existing
        else:
            user_doc = {
                "email": email,
                "password_hash": hash_password(str(uuid.uuid4())),
                "first_name": first_name,
                "last_name": last_name,
                "role": "user",
            }
            user = await self.repo.create(user_doc)

        user_id = str(user.id)
        role = user.role or "user"
        return TokenResponse(
            access_token=create_access_token(user_id, role=role),
            refresh_token=create_refresh_token(user_id),
        )

    async def authenticate_linkedin(self, code: str) -> TokenResponse:
        import uuid
        import httpx
        if not settings.linkedin_client_id or not settings.linkedin_client_secret:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "LinkedIn OAuth credentials are not configured in backend .env",
            )

        redirect_uri = f"{settings.frontend_origin}/auth/linkedin/callback"
        async with httpx.AsyncClient(timeout=10.0) as client:
            token_res = await client.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "client_id": settings.linkedin_client_id,
                    "client_secret": settings.linkedin_client_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if token_res.status_code != 200:
                logger.error("LinkedIn token exchange failed: %s", token_res.text)
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    "Failed to exchange authorization code with LinkedIn",
                )
            token_data = token_res.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid token response from LinkedIn")

            profile_res = await client.get(
                "https://api.linkedin.com/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if profile_res.status_code != 200:
                logger.error("LinkedIn userinfo failed: %s", profile_res.text)
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Failed to fetch profile from LinkedIn")

            user_data = profile_res.json()
            email = user_data.get("email")
            first_name = user_data.get("given_name") or user_data.get("name", "").split(" ")[0]
            last_name = user_data.get("family_name") or ""
            sub = user_data.get("sub") or ""

            if not email:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "LinkedIn account has no public email address")

            existing = await self.repo.get_by_email(email)
            if existing:
                user = existing
                if not getattr(user, "linkedin", None) and sub:
                    await self.repo.update(user.id, {"linkedin": f"https://www.linkedin.com/in/{sub}"})
            else:
                user_doc = {
                    "email": email,
                    "password_hash": hash_password(str(uuid.uuid4())),
                    "first_name": first_name,
                    "last_name": last_name,
                    "linkedin": f"https://www.linkedin.com/in/{sub}" if sub else "",
                    "role": "user",
                }
                user = await self.repo.create(user_doc)

            user_id = str(user.id)
            role = user.role or "user"
            return TokenResponse(
                access_token=create_access_token(user_id, role=role),
                refresh_token=create_refresh_token(user_id),
            )

    async def authenticate_github(self, code: str) -> TokenResponse:
        """Exchange a GitHub OAuth authorization code for a Denno session."""
        import uuid
        import httpx

        if not settings.github_client_id or not settings.github_client_secret:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "GitHub OAuth credentials are not configured in backend .env",
            )

        async with httpx.AsyncClient(timeout=10.0) as client:
            # 1. Exchange code for GitHub access token
            token_res = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                },
                headers={"Accept": "application/json"},
            )
            if token_res.status_code != 200:
                logger.error("GitHub token exchange failed: %s", token_res.text)
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    "Failed to exchange authorization code with GitHub",
                )
            token_data = token_res.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid token response from GitHub")

            # 2. Fetch user profile
            user_res = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            )
            if user_res.status_code != 200:
                logger.error("GitHub user fetch failed: %s", user_res.text)
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Failed to fetch profile from GitHub")

            profile = user_res.json()
            login = profile.get("login", "")
            name = profile.get("name") or login
            name_parts = name.split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""

            # 3. Fetch primary verified email
            email_res = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            )
            emails_data = email_res.json() if email_res.status_code == 200 else []
            email = None
            for e in emails_data:
                if e.get("primary") and e.get("verified"):
                    email = e.get("email")
                    break
            if not email:
                email = profile.get("email")
            if not email:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "GitHub account has no verified public email")

            existing = await self.repo.get_by_email(email)
            if existing:
                user = existing
                # Update GitHub link if not already set
                if not getattr(user, "github", None) and login:
                    await self.repo.update(user.id, {"github": f"https://github.com/{login}"})
            else:
                user_doc = {
                    "email": email,
                    "password_hash": hash_password(str(uuid.uuid4())),
                    "first_name": first_name,
                    "last_name": last_name,
                    "github": f"https://github.com/{login}" if login else "",
                    "role": "user",
                }
                user = await self.repo.create(user_doc)

            user_id = str(user.id)
            role = user.role or "user"
            return TokenResponse(
                access_token=create_access_token(user_id, role=role),
                refresh_token=create_refresh_token(user_id),
            )
