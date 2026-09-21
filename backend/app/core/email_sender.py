"""
Async transactional email sender for Denno Career OS.
Uses aiosmtplib for non-blocking SMTP delivery.

All outbound email is gated on ``settings.emails_enabled``.
Set ``EMAILS_ENABLED=false`` (or leave SMTP_USER blank) in .env
to run locally without an SMTP server — every send will be
logged as a no-op instead of raising an error.
"""
import asyncio
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("denno.email")

# SMTP connection timeout in seconds — prevents hanging forever on broken connections
_SMTP_TIMEOUT = 30


async def _send(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
) -> None:
    """Low-level async email send with HTTP API fallback (Resend/Brevo/SendGrid) and SMTP."""
    if not settings.emails_enabled:
        logger.info(
            "[EmailSender] EMAILS_ENABLED=false — skipping send to %s | subject=%s",
            to_email,
            subject,
        )
        return

    sender_email = (
        settings.smtp_from_email or settings.smtp_user or "noreply@denno.app"
    ).strip()
    sender_name = (settings.smtp_from_name or "Denno Career OS").strip()

    # ── HTTP API Provider Fallbacks (Port 443 HTTPS — works on Render free tier) ──
    if settings.resend_api_key:
        try:
            import urllib.request, json as _json
            # Priority: dedicated RESEND_FROM_EMAIL setting → smtp_from_email → onboarding@resend.dev
            # "onboarding@resend.dev" works without domain verification on full (non-sending-only) keys.
            # For Sending-Only API keys the sender MUST be from a verified domain in Resend dashboard.
            # Set RESEND_FROM_EMAIL=you@yourdomain.com in Render env vars after verifying your domain.
            resend_from_email = (
                settings.resend_from_email
                or settings.smtp_from_email
                or "onboarding@resend.dev"
            ).strip()
            resend_from_name = (settings.smtp_from_name or "Denno Career OS").strip()
            req = urllib.request.Request(
                "https://api.resend.com/emails",
                data=_json.dumps({
                    "from": f"{resend_from_name} <{resend_from_email}>",
                    "to": [to_email],
                    "subject": subject,
                    "html": html_body,
                    "text": text_body,
                }).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key.strip()}",
                    "Content-Type": "application/json",
                    "User-Agent": "DennoCareerOS/1.0",
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                if resp.status in (200, 201, 202):
                    logger.info(
                        "[EmailSender] ✓ Email sent via Resend to %s | subject=%s | from=%s",
                        to_email, subject, resend_from_email,
                    )
                    return
        except urllib.request.HTTPError as resend_http_err:
            try:
                err_body = resend_http_err.read().decode("utf-8", errors="replace")
            except Exception:
                err_body = "<unreadable>"
            
            hint = ""
            if "Invalid `to` field" in err_body or "domains like `example.com`" in err_body:
                hint = " (Note: onboarding@resend.dev can ONLY send to your Resend signup email address. To send to any address, verify a custom domain at https://resend.com/domains)."

            logger.warning(
                "[EmailSender] Resend send failed (HTTP %s: %s) | from=%s | body=%s%s Falling back to SMTP...",
                resend_http_err.code, resend_http_err.reason, resend_from_email, err_body, hint,
            )
        except Exception as resend_err:
            logger.warning("[EmailSender] Resend send failed (%s). Falling back to SMTP...", resend_err)

    if settings.brevo_api_key:
        try:
            import urllib.request, json
            raw_brevo_from = (settings.brevo_from_email or "").strip()
            if not raw_brevo_from or raw_brevo_from == "noreply@denno.app":
                if settings.smtp_from_email and settings.smtp_from_email.strip() != "noreply@denno.app":
                    raw_brevo_from = settings.smtp_from_email.strip()
                elif settings.smtp_user:
                    raw_brevo_from = settings.smtp_user.strip()
                else:
                    # Fall back to recipient email (works great when sending resets to your own Brevo signup address)
                    raw_brevo_from = to_email

            brevo_from = raw_brevo_from
            req = urllib.request.Request(
                "https://api.brevo.com/v3/smtp/email",
                data=json.dumps({
                    "sender": {"name": sender_name, "email": brevo_from},
                    "to": [{"email": to_email}],
                    "subject": subject,
                    "htmlContent": html_body,
                }).encode("utf-8"),
                headers={
                    "api-key": settings.brevo_api_key.strip(),
                    "Content-Type": "application/json",
                    "User-Agent": "DennoCareerOS/1.0",
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                if resp.status in (200, 201, 202):
                    logger.info("[EmailSender] ✓ Email sent via Brevo HTTP API to %s | subject=%s | from=%s", to_email, subject, brevo_from)
                    return
        except urllib.request.HTTPError as brevo_http_err:
            try:
                err_body = brevo_http_err.read().decode("utf-8", errors="replace")
            except Exception:
                err_body = "<unreadable>"
            logger.warning(
                "[EmailSender] Brevo HTTP API send failed (HTTP %s: %s) | from=%s | body=%s. Falling back to SMTP...",
                brevo_http_err.code, brevo_http_err.reason, brevo_from, err_body
            )
        except Exception as brevo_err:
            logger.warning("[EmailSender] Brevo HTTP API send failed (%s). Falling back...", brevo_err)

    if not settings.smtp_user:
        logger.warning(
            "[EmailSender] SMTP_USER not configured — cannot send email to %s | subject=%s. "
            "Set SMTP_USER and SMTP_PASSWORD or RESEND_API_KEY/BREVO_API_KEY in Render dashboard.",
            to_email,
            subject,
        )
        return

    if not settings.smtp_password:
        logger.warning(
            "[EmailSender] SMTP_PASSWORD not configured — cannot send email to %s | subject=%s. "
            "Set SMTP_PASSWORD environment variable (Render dashboard or .env).",
            to_email,
            subject,
        )
        return

    try:
        import aiosmtplib  # type: ignore

        # Resolve the sender address:
        # For Gmail, the From address MUST exactly match the authenticated SMTP_USER.
        # Gmail's servers reject any mismatched From header with a 535 error.
        # Also treat "noreply@denno.app" as a placeholder that should be replaced.
        _placeholder_from = ("", "noreply@denno.app", "noreply@denno.app ".strip())
        is_gmail = bool(settings.smtp_host and "gmail" in settings.smtp_host.lower())
        if is_gmail or (settings.smtp_from_email or "").strip() in _placeholder_from:
            # Force sender to match the authenticated account (required by Gmail)
            sender_email = (settings.smtp_user or "").strip()
        else:
            sender_email = (
                settings.smtp_from_email or settings.smtp_user or "noreply@denno.app"
            ).strip()

        if not sender_email:
            sender_email = (settings.smtp_user or "noreply@denno.app").strip()

        sender_name = (settings.smtp_from_name or "Denno Career OS").strip()

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{sender_name} <{sender_email}>"
        msg["To"] = to_email
        msg["X-Mailer"] = "Denno Career OS"
        msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        # Strip ALL spaces from app password — Gmail App Passwords are 16 chars, no spaces.
        # Users sometimes copy them with spaces between groups (e.g. "abcd efgh ijkl mnop").
        smtp_password = (settings.smtp_password or "").replace(" ", "")

        # Auto-detect SSL mode from port number:
        #   Port 465 → use_tls=True  (SMTPS — direct SSL on connect)
        #   Port 587  → start_tls=True (STARTTLS — plain connect then upgrade)
        #   Other ports → honour the SMTP_USE_SSL setting
        # This prevents the common misconfiguration of port 465 + STARTTLS which always fails.
        port = settings.smtp_port
        if port == 465:
            use_ssl = True
        elif port == 587:
            use_ssl = False
        else:
            use_ssl = settings.smtp_use_ssl

        logger.info(
            "[EmailSender] Attempting SMTP send to=%s via %s:%d | mode=%s | from=%s | subject=%s",
            to_email,
            settings.smtp_host,
            port,
            "SSL/SMTPS" if use_ssl else "STARTTLS",
            sender_email,
            subject,
        )

        # Multi-strategy attempt: try aiosmtplib first, fall back to IPv4 smtplib (port 587 / 465)
        send_success = False
        last_error = None

        # Strategy 1: Primary aiosmtplib attempt
        try:
            if use_ssl:
                await asyncio.wait_for(
                    aiosmtplib.send(
                        msg,
                        hostname=settings.smtp_host,
                        port=port,
                        username=settings.smtp_user,
                        password=smtp_password,
                        use_tls=True,
                        sender=sender_email,
                    ),
                    timeout=15,
                )
            else:
                await asyncio.wait_for(
                    aiosmtplib.send(
                        msg,
                        hostname=settings.smtp_host,
                        port=port,
                        username=settings.smtp_user,
                        password=smtp_password,
                        start_tls=True,
                        sender=sender_email,
                    ),
                    timeout=15,
                )
            send_success = True
        except Exception as primary_exc:
            last_error = primary_exc
            logger.warning(
                "[EmailSender] Primary aiosmtplib send failed (%s). Attempting IPv4 fallback...",
                primary_exc,
            )

        # Strategy 2: If primary failed (e.g. IPv6 network unreachable Errno 101), try IPv4 multi-port fallback
        if not send_success:
            def _sync_ipv4_send():
                import socket
                import smtplib
                import ssl

                def _create_ipv4_conn(addr, conn_timeout=12):
                    h, p = addr
                    for res in socket.getaddrinfo(h, p, socket.AF_INET, socket.SOCK_STREAM):
                        af, socktype, proto, canon, sa = res
                        s = socket.socket(af, socktype, proto)
                        s.settimeout(conn_timeout)
                        s.connect(sa)
                        return s
                    raise socket.error(f"No IPv4 address for {h}")

                # Try (mode, port) combinations
                strategies = [
                    ("IPv4_TLS", 587),
                    ("IPv4_SSL", 465),
                    ("STD_TLS", 587),
                    ("STD_SSL", 465),
                ]
                
                sync_errors = []
                for mode, p in strategies:
                    try:
                        if mode == "IPv4_TLS":
                            raw_sock = _create_ipv4_conn((settings.smtp_host, p))
                            with smtplib.SMTP(settings.smtp_host, p, timeout=15) as s:
                                s.sock = raw_sock
                                s.ehlo()
                                s.starttls()
                                s.ehlo()
                                s.login(settings.smtp_user, smtp_password)
                                s.sendmail(sender_email, [to_email], msg.as_string())
                                return True
                        elif mode == "IPv4_SSL":
                            raw_sock = _create_ipv4_conn((settings.smtp_host, p))
                            ctx = ssl.create_default_context()
                            ssl_sock = ctx.wrap_socket(raw_sock, server_hostname=settings.smtp_host)
                            with smtplib.SMTP_SSL(settings.smtp_host, p, timeout=15) as s:
                                s.sock = ssl_sock
                                s.login(settings.smtp_user, smtp_password)
                                s.sendmail(sender_email, [to_email], msg.as_string())
                                return True
                        elif mode == "STD_TLS":
                            with smtplib.SMTP(settings.smtp_host, p, timeout=15) as s:
                                s.ehlo()
                                s.starttls()
                                s.ehlo()
                                s.login(settings.smtp_user, smtp_password)
                                s.sendmail(sender_email, [to_email], msg.as_string())
                                return True
                        elif mode == "STD_SSL":
                            with smtplib.SMTP_SSL(settings.smtp_host, p, timeout=15) as s:
                                s.login(settings.smtp_user, smtp_password)
                                s.sendmail(sender_email, [to_email], msg.as_string())
                                return True
                    except Exception as err:
                        sync_errors.append(f"{mode}:{p} -> {err}")

                raise RuntimeError(f"All SMTP strategies failed: {'; '.join(sync_errors)}")

            await asyncio.to_thread(_sync_ipv4_send)
            send_success = True

        logger.info("[EmailSender] ✓ Email sent to %s | subject=%s", to_email, subject)


    except ImportError:
        logger.error(
            "[EmailSender] aiosmtplib not installed — cannot send email to %s. "
            "Run: pip install aiosmtplib",
            to_email,
        )
        raise
    except asyncio.TimeoutError:
        logger.error(
            "[EmailSender] SMTP connection timed out after %ds sending to %s | host=%s:%d",
            _SMTP_TIMEOUT,
            to_email,
            settings.smtp_host,
            settings.smtp_port,
        )
        raise RuntimeError(
            f"SMTP connection timed out connecting to {settings.smtp_host}:{settings.smtp_port}. "
            "Check your SMTP_HOST, SMTP_PORT, and firewall settings."
        )
    except Exception as exc:
        # Log SMTP-specific details to help with debugging in Render logs
        error_str = str(exc)
        if "535" in error_str or "authentication" in error_str.lower() or "credentials" in error_str.lower():
            logger.error(
                "[EmailSender] SMTP AUTH FAILED for %s — check SMTP_USER and SMTP_PASSWORD. "
                "If using Gmail, ensure you're using a 16-char App Password (not your login password). "
                "Enable 2FA then create one at: https://myaccount.google.com/apppasswords | error=%s",
                settings.smtp_user,
                exc,
            )
        elif "534" in error_str or "less secure" in error_str.lower():
            logger.error(
                "[EmailSender] Gmail blocked login — enable 2-Step Verification and use an App Password. "
                "See: https://myaccount.google.com/apppasswords | error=%s",
                exc,
            )
        elif "connection" in error_str.lower() or "refused" in error_str.lower():
            logger.error(
                "[EmailSender] SMTP connection refused to %s:%d — check SMTP_HOST/SMTP_PORT settings | error=%s",
                settings.smtp_host,
                settings.smtp_port,
                exc,
            )
        else:
            logger.error(
                "[EmailSender] Failed to send email to %s | subject=%s | error=%s",
                to_email,
                subject,
                exc,
            )
        raise


async def send_password_reset(to_email: str, reset_token: str, first_name: str = "") -> None:
    """Send a password reset email with the one-time JWT link."""
    reset_link = f"{settings.frontend_origin}/reset-password?token={reset_token}"
    greeting = f"Hi {first_name}," if first_name else "Hi,"

    subject = "Reset your Denno password"
    text_body = (
        f"{greeting}\n\n"
        f"We received a request to reset the password for your Denno Career OS account.\n\n"
        f"Click the link below to set a new password (expires in 60 minutes):\n\n"
        f"{reset_link}\n\n"
        f"If you didn't request this, you can safely ignore this email.\n\n"
        f"— The Denno Team"
    )
    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:28px 40px;text-align:center;">
            <div style="display:inline-block;width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:12px;line-height:48px;font-size:24px;font-weight:900;color:#fff;margin-bottom:8px;">D</div>
            <div style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.5px;">Denno Career OS</div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#f1f5f9;">{greeting}</p>
            <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.6;">
              We received a request to reset the password for your Denno Career OS account.
              Click the button below to choose a new password. This link expires in <strong style="color:#60a5fa;">60 minutes</strong>.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="{reset_link}"
                 style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
                Reset My Password →
              </a>
            </div>
            <p style="margin:20px 0 0;font-size:12px;color:#64748b;line-height:1.6;">
              If you didn't request a password reset, you can safely ignore this email.
              Your password will remain unchanged.<br><br>
              Or copy and paste this link into your browser:<br>
              <a href="{reset_link}" style="color:#60a5fa;word-break:break-all;">{reset_link}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 24px;border-top:1px solid #334155;text-align:center;">
            <p style="margin:0;font-size:11px;color:#475569;">Denno Career OS · Personal Career Intelligence Platform</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""
    await _send(to_email, subject, html_body, text_body)


async def send_welcome(to_email: str, first_name: str = "") -> None:
    """Send a welcome email to a newly registered user."""
    greeting = f"Welcome, {first_name}!" if first_name else "Welcome to Denno!"
    dashboard_link = f"{settings.frontend_origin}/applications"

    subject = "Welcome to Denno Career OS 🚀"
    text_body = (
        f"{greeting}\n\n"
        f"Your Denno Career OS account is ready. "
        f"Start tracking applications, discovering jobs, and accelerating your career.\n\n"
        f"Open your dashboard: {dashboard_link}\n\n"
        f"— The Denno Team"
    )
    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:28px 40px;text-align:center;">
            <div style="font-size:32px;margin-bottom:4px;">🚀</div>
            <div style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.5px;">Denno Career OS</div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 12px;font-size:20px;font-weight:700;color:#f1f5f9;">{greeting}</p>
            <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.6;">
              Your account is live. Denno gives you one platform for your entire job search —
              applications, CVs, interviews, job feeds, and AI-powered career tools.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="{dashboard_link}"
                 style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;">
                Open Dashboard →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 24px;border-top:1px solid #334155;text-align:center;">
            <p style="margin:0;font-size:11px;color:#475569;">Denno Career OS · Personal Career Intelligence Platform</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""
    await _send(to_email, subject, html_body, text_body)


async def send_notification_digest(
    to_email: str,
    first_name: str,
    notifications: list[dict],
) -> None:
    """Send a digest of recent unread notifications."""
    if not notifications:
        return

    greeting = f"Hi {first_name}," if first_name else "Hi,"
    count = len(notifications)
    subject = f"You have {count} new update{'s' if count != 1 else ''} on Denno"

    items_text = "\n".join(f"• {n.get('title', '')}: {n.get('message', '')}" for n in notifications[:10])
    text_body = f"{greeting}\n\nYou have {count} new notification{'s' if count != 1 else ''} on Denno:\n\n{items_text}\n\n— The Denno Team"

    items_html = "".join(
        f'<tr><td style="padding:10px 0;border-bottom:1px solid #334155;">'
        f'<div style="font-size:13px;font-weight:600;color:#f1f5f9;">{n.get("title","")}</div>'
        f'<div style="font-size:12px;color:#94a3b8;margin-top:2px;">{n.get("message","")}</div>'
        f"</td></tr>"
        for n in notifications[:10]
    )

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid #334155;">
        <tr><td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:24px 40px;">
          <div style="font-size:18px;font-weight:700;color:#fff;">Denno Career OS</div>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:15px;font-weight:600;color:#f1f5f9;">{greeting}</p>
          <p style="margin:0 0 20px;font-size:13px;color:#94a3b8;">You have <strong style="color:#60a5fa;">{count}</strong> new update{'s' if count != 1 else ''} waiting for you:</p>
          <table width="100%" cellpadding="0" cellspacing="0">{items_html}</table>
          <div style="text-align:center;margin-top:28px;">
            <a href="{settings.frontend_origin}/applications" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;">View Dashboard →</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""
    await _send(to_email, subject, html_body, text_body)
