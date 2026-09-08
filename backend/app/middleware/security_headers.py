"""
Security headers middleware.

Injects HTTP security headers on every response to defend against common
browser-based attacks (clickjacking, MIME sniffing, XSS reflection, etc.).

Registered in main.py's middleware stack.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings

_IS_PROD = settings.app_env == "production"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # ── Standard defence headers ──────────────────────────────────────────

        # Prevent MIME type sniffing (e.g. serving a JS file as text/plain
        # and having the browser execute it anyway).
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Deny embedding in iframes (clickjacking defence).
        response.headers["X-Frame-Options"] = "DENY"

        # Legacy XSS filter hint for older browsers.
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Don't send the full Referrer URL to third parties.
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Prevent Flash/PDF cross-domain reads.
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

        # Prevent the page from opening other pages that retain a reference
        # back (Spectre / side-channel mitigation).
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"

        # Allow cross-origin requests from the frontend SPA (CORS policy manages allowed origins).
        response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"

        # Disable powerful browser features this app doesn't need.
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=(), "
            "usb=(), bluetooth=(), accelerometer=(), gyroscope=()"
        )

        # Prevent browsers and intermediate proxies from caching API responses
        # (especially auth responses that contain tokens or sensitive profile data).
        response.headers["Cache-Control"] = "no-store, max-age=0"
        response.headers["Pragma"] = "no-cache"

        # Stop browsers from pre-fetching DNS for links on API responses.
        # This prevents internal service hostnames leaking through browser telemetry.
        response.headers["X-DNS-Prefetch-Control"] = "off"

        # ── HTTPS enforcement (production only) ───────────────────────────────
        if _IS_PROD:
            # Tell browsers to use HTTPS for 1 year and include subdomains.
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # ── Content Security Policy ───────────────────────────────────────────
        # Production restricts connect-src to only the real frontend origin;
        # development keeps localhost/WS for Vite HMR.
        if _IS_PROD:
            connect_src = f"connect-src 'self' {settings.frontend_origin}"
        else:
            connect_src = (
                f"connect-src 'self' {settings.frontend_origin} "
                "http://localhost:* http://127.0.0.1:* ws://localhost:*"
            )

        csp_directives = [
            "default-src 'self'",
            connect_src,
            "img-src 'self' data: https:",
            "font-src 'self' https://fonts.gstatic.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "object-src 'none'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]
        if _IS_PROD:
            # Production: no inline scripts; require HTTPS for all resources.
            csp_directives.append("script-src 'self'")
            csp_directives.append("upgrade-insecure-requests")
        else:
            # Development: allow inline scripts for Vite HMR.
            csp_directives.append("script-src 'self' 'unsafe-inline'")

        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

        return response
