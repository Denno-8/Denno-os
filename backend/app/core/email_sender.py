"""
Async transactional email sender for Denno Career OS.
Uses aiosmtplib for non-blocking SMTP delivery.

All outbound email is gated on ``settings.emails_enabled``.
Set ``EMAILS_ENABLED=false`` (or leave SMTP_USER blank) in .env
to run locally without an SMTP server — every send will be
logged as a no-op instead of raising an error.
"""
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("denno.email")


async def _send(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
) -> None:
    """Low-level async SMTP send. Raises on failure."""
    if not settings.emails_enabled or not settings.smtp_user:
        logger.info(
            "[EmailSender] SMTP disabled or unconfigured — skipping send to %s | subject=%s",
            to_email,
            subject,
        )
        return

    try:
        import aiosmtplib  # type: ignore

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        msg["To"] = to_email
        msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            use_tls=settings.smtp_use_ssl,
            start_tls=settings.smtp_tls and not settings.smtp_use_ssl,
        )
        logger.info("[EmailSender] Email sent to %s | subject=%s", to_email, subject)
    except ImportError:
        logger.warning(
            "[EmailSender] aiosmtplib not installed — cannot send email to %s. "
            "Run: pip install aiosmtplib",
            to_email,
        )
    except Exception as exc:
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
    html_body = f"""
<!DOCTYPE html>
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
    html_body = f"""
<!DOCTYPE html>
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

    html_body = f"""
<!DOCTYPE html>
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
