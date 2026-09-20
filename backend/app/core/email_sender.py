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
    """Low-level async SMTP send. Raises on failure."""
    if not settings.emails_enabled:
        logger.info(
            "[EmailSender] EMAILS_ENABLED=false — skipping send to %s | subject=%s",
            to_email,
            subject,
        )
        return

    if not settings.smtp_user:
        logger.warning(
            "[EmailSender] SMTP_USER not configured — cannot send email to %s | subject=%s. "
            "Set SMTP_USER and SMTP_PASSWORD environment variables (Render dashboard or .env).",
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

        # aiosmtplib: use_tls=True → immediate SSL on connect (port 465)
        # start_tls=True → STARTTLS upgrade after plain connect (port 587)
        # These are mutually exclusive; never pass both.
        if use_ssl:
            # Port 465 — direct SSL (SMTPS)
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
                timeout=_SMTP_TIMEOUT,
            )
        else:
            # Port 587 — STARTTLS (plain → encrypted upgrade)
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
                timeout=_SMTP_TIMEOUT,
            )
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
