from typing import List, Dict, Any
import io
import uuid
import smtplib
import imaplib
import socket
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from email.utils import formatdate
from datetime import datetime, date, timedelta, timezone

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.email_repository import EmailRepository
from app.schemas.email import EmailCreate, EmailUpdate
from app.core.config import settings
from app.models.sqlalchemy_models import Application, Interview, CalendarEvent, Recruiter, User


def create_ipv4_connection(address, timeout=socket._GLOBAL_DEFAULT_TIMEOUT, source_address=None):
    """
    Explicitly forces socket connection via IPv4 (socket.AF_INET) to bypass Windows dual-stack
    IPv6 unreachable route socket failures ([Errno 101] / [WinError 10051]).
    """
    host, port = address
    err = None
    for res in socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM):
        af, socktype, proto, canonname, sa = res
        sock = None
        try:
            sock = socket.socket(af, socktype, proto)
            if timeout is not socket._GLOBAL_DEFAULT_TIMEOUT and timeout is not None:
                sock.settimeout(timeout)
            if source_address:
                sock.bind(source_address)
            sock.connect(sa)
            return sock
        except socket.error as _:
            err = _
            if sock is not None:
                sock.close()
    if err is not None:
        raise err
    else:
        raise socket.error("getaddrinfo returned an empty result for IPv4")


class IPv4SMTP(smtplib.SMTP):
    def _get_socket(self, host, port, timeout):
        return create_ipv4_connection((host, port), timeout, self.source_address)


class IPv4SMTP_SSL(smtplib.SMTP_SSL):
    def _get_socket(self, host, port, timeout):
        new_socket = create_ipv4_connection((host, port), timeout, self.source_address)
        return self.context.wrap_socket(new_socket, server_hostname=self._host)


class IPv4IMAP4_SSL(imaplib.IMAP4_SSL):
    def open(self, host='', port=993, timeout=None):
        self.host = host
        self.port = port
        self.sock = create_ipv4_connection((host, port), timeout)
        self.sock = self.ssl_context.wrap_socket(self.sock, server_hostname=host)
        self.file = self.sock.makefile('rb')


def _serialize(email) -> dict:
    return {
        "id": str(email.id),
        "user_id": email.user_id,
        "from_name": getattr(email, "from_name", ""),
        "subject": email.subject,
        "body": getattr(email, "body", ""),
        "category": getattr(email, "category", ""),
        "read": getattr(email, "read", False),
        "received_at": getattr(email, "received_at", None),
        "recommended_action": getattr(email, "recommended_action", ""),
        "application_id": str(email.application_id) if getattr(email, "application_id", None) else None,
        "source": getattr(email, "source", "manual"),
        "created_at": email.created_at,
        "updated_at": email.updated_at,
    }


def _generate_cover_letter_pdf(
    applicant_name: str,
    applicant_email: str,
    applicant_phone: str,
    applicant_location: str,
    company_name: str,
    role_title: str,
    cover_letter_text: str
) -> bytes:
    """Generate a clean, styled Cover Letter PDF document using ReportLab."""
    import html
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=45, leftMargin=45, topMargin=45, bottomMargin=45)
    story = []

    primary_color = colors.HexColor("#1e40af")   # Deep Sapphire
    secondary_color = colors.HexColor("#2563eb") # Bright Accent Blue
    text_color = colors.HexColor("#1e293b")      # Slate 800
    muted_color = colors.HexColor("#64748b")     # Slate 500

    styles = getSampleStyleSheet()

    name_style = ParagraphStyle(
        "CLName",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=22,
        textColor=primary_color,
        spaceAfter=3
    )
    role_sub_style = ParagraphStyle(
        "CLRoleSub",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=secondary_color,
        spaceAfter=6
    )
    contact_style = ParagraphStyle(
        "CLContact",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=muted_color,
        spaceAfter=10
    )
    recip_style = ParagraphStyle(
        "CLRecip",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=text_color,
        spaceBefore=8,
        spaceAfter=12
    )
    subject_style = ParagraphStyle(
        "CLSubject",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=primary_color,
        spaceBefore=6,
        spaceAfter=12
    )
    body_style = ParagraphStyle(
        "CLBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=15,
        textColor=text_color,
        spaceAfter=10
    )

    def esc(txt: str) -> str:
        return html.escape(txt or "")

    safe_name = applicant_name or "Job Applicant"
    story.append(Paragraph(esc(safe_name), name_style))
    story.append(Paragraph(f"Application for {esc(role_title)}", role_sub_style))

    contact_parts = []
    if applicant_email:
        contact_parts.append(f"Email: {esc(applicant_email)}")
    if applicant_phone:
        contact_parts.append(f"Phone: {esc(applicant_phone)}")
    if applicant_location:
        contact_parts.append(f"Location: {esc(applicant_location)}")
    if contact_parts:
        story.append(Paragraph(" &nbsp;•&nbsp; ".join(contact_parts), contact_style))

    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=14))

    today_str = datetime.now().strftime("%B %d, %Y")
    recip_text = f"<b>Date:</b> {today_str}<br/><b>To:</b> Hiring Team / Talent Acquisition<br/><b>Company:</b> {esc(company_name)}"
    story.append(Paragraph(recip_text, recip_style))
    story.append(Paragraph(f"<b>RE: Application for {esc(role_title)} Position</b>", subject_style))

    clean_letter = cover_letter_text.strip() if cover_letter_text else f"Dear Hiring Team at {company_name},\n\nI am writing to express my strong interest in the {role_title} position at {company_name}.\n\nBest regards,\n{safe_name}"

    for paragraph_block in clean_letter.split("\n\n"):
        para_text = paragraph_block.strip().replace("\n", "<br/>")
        if para_text:
            story.append(Paragraph(esc(para_text).replace("&lt;br/&gt;", "<br/>"), body_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def _generate_application_letter_pdf(
    applicant_name: str,
    applicant_email: str,
    applicant_phone: str,
    applicant_location: str,
    company_name: str,
    role_title: str,
    letter_text: str
) -> bytes:
    """Generate a formal, job-aware Application Letter PDF document using ReportLab."""
    import html
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=45, leftMargin=45, topMargin=45, bottomMargin=45)
    story = []

    primary_color = colors.HexColor("#0f172a")   # Slate 900
    accent_color = colors.HexColor("#2563eb")    # Sapphire Blue
    text_color = colors.HexColor("#1e293b")      # Dark Body Text
    muted_color = colors.HexColor("#64748b")     # Subtitle Slate

    styles = getSampleStyleSheet()

    header_name_style = ParagraphStyle(
        "ALName",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        textColor=primary_color,
        spaceAfter=2
    )
    header_sub_style = ParagraphStyle(
        "ALSub",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=accent_color,
        spaceAfter=6
    )
    header_meta_style = ParagraphStyle(
        "ALMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        textColor=muted_color,
        spaceAfter=8
    )
    recip_block_style = ParagraphStyle(
        "ALRecip",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=text_color,
        spaceBefore=6,
        spaceAfter=10
    )
    subject_style = ParagraphStyle(
        "ALSubject",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=accent_color,
        spaceBefore=4,
        spaceAfter=10
    )
    body_style = ParagraphStyle(
        "ALBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14.5,
        textColor=text_color,
        spaceAfter=9
    )

    def esc(txt: str) -> str:
        return html.escape(txt or "")

    safe_name = applicant_name or "Job Applicant"
    story.append(Paragraph(esc(safe_name).upper(), header_name_style))
    story.append(Paragraph(f"FORMAL JOB APPLICATION LETTER &bull; {esc(role_title).upper()}", header_sub_style))

    contact_parts = []
    if applicant_email:
        contact_parts.append(f"Email: {esc(applicant_email)}")
    if applicant_phone:
        contact_parts.append(f"Phone: {esc(applicant_phone)}")
    if applicant_location:
        contact_parts.append(f"Location: {esc(applicant_location)}")
    if contact_parts:
        story.append(Paragraph(" &nbsp;|&nbsp; ".join(contact_parts), header_meta_style))

    story.append(HRFlowable(width="100%", thickness=1.2, color=accent_color, spaceAfter=12))

    today_str = datetime.now().strftime("%B %d, %Y")
    recip_text = f"<b>Date:</b> {today_str}<br/><b>To:</b> Recruitment Director / Hiring Committee<br/><b>Organization:</b> {esc(company_name)}"
    story.append(Paragraph(recip_text, recip_block_style))
    story.append(Paragraph(f"<b>SUBJECT: OFFICIAL APPLICATION FOR THE {esc(role_title).upper()} POSITION</b>", subject_style))

    clean_text = letter_text.strip() if letter_text else (
        f"Dear Hiring Manager,\n\n"
        f"I am writing to formally submit my application for the {role_title} position at {company_name}. "
        f"Enclosed are my Resume, Cover Letter, and relevant credentials for your review.\n\n"
        f"Sincerely,\n{safe_name}"
    )

    for paragraph_block in clean_text.split("\n\n"):
        para_text = paragraph_block.strip().replace("\n", "<br/>")
        if para_text:
            story.append(Paragraph(esc(para_text).replace("&lt;br/&gt;", "<br/>"), body_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


class EmailService:
    def __init__(self, db: AsyncSession):
        self.repo = EmailRepository(db)

    async def list(self, user_id: int, unread_only: bool = False, skip: int = 0, limit: int = 100) -> list[dict]:
        emails = await self.repo.list_for_user(user_id, unread_only=unread_only, skip=skip, limit=limit)
        return [_serialize(email) for email in emails]

    async def unread_count(self, user_id: int) -> int:
        emails = await self.repo.list_for_user(user_id, unread_only=True)
        return len(emails)

    async def get(self, email_id: int, user_id: int) -> dict | None:
        email = await self.repo.get_by_id(email_id, user_id)
        return _serialize(email) if email else None

    async def create(self, user_id: int, payload: EmailCreate) -> dict:
        doc = payload.model_dump()
        doc["user_id"] = user_id
        if doc.get("application_id"):
            doc["application_id"] = int(doc["application_id"])
        else:
            doc["application_id"] = None

        created = await self.repo.create(doc)
        return _serialize(created)

    async def update(self, email_id: int, user_id: int, payload: EmailUpdate) -> dict | None:
        data = payload.model_dump(exclude_unset=True)
        updated = await self.repo.update(email_id, user_id, data)
        return _serialize(updated) if updated else None

    async def delete(self, email_id: int, user_id: int) -> bool:
        return await self.repo.delete(email_id, user_id)

    async def send_application_email(
        self,
        user_id: int,
        recruiter_email: str,
        company_name: str,
        role_title: str,
        cover_letter: str,
        cv_snapshot: dict | None = None,
        app_letter_snapshot: dict | None = None,
        app_letter_text: str | None = None,
        application_id: int | None = None,
        applicant_info: dict | None = None,
    ) -> dict:
        """
        Dispatches an official job application email with PDF attachments (Resume, Cover Letter, Application Letter).
        Supports multi-port IPv4 SMTP fallback (587 TLS / 465 SSL), stores a copy in Gmail Sent Mail via IMAP,
        and logs the record into the database.
        """
        import re

        # ── 1. Fetch User details for email header & signature ──
        applicant_name = None
        applicant_email = None
        applicant_phone = None
        applicant_location = None

        if applicant_info and isinstance(applicant_info, dict):
            applicant_name = applicant_info.get("name")
            applicant_email = applicant_info.get("email")
            applicant_phone = applicant_info.get("phone")
            applicant_location = applicant_info.get("location")

        if not applicant_name or not applicant_email:
            user_res = await self.repo.session.execute(select(User).where(User.id == user_id))
            current_user = user_res.scalars().first()
            if current_user:
                full_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()
                applicant_name = applicant_name or full_name or current_user.email.split("@")[0].title()
                applicant_email = applicant_email or current_user.email
                applicant_phone = applicant_phone or getattr(current_user, "phone", "")
                applicant_location = applicant_location or getattr(current_user, "location", "")

        applicant_name = applicant_name or "Job Candidate"
        applicant_email = applicant_email or settings.smtp_from_email or "candidate@denno.com"
        applicant_phone = applicant_phone or ""
        applicant_location = applicant_location or "Nairobi, Kenya"

        clean_applicant_filename = re.sub(r'[^a-zA-Z0-9]', '_', applicant_name)

        # ── 2. Build Cover Letter & Application Letter PDFs ──
        effective_app_letter = app_letter_text or (app_letter_snapshot.get("content") if isinstance(app_letter_snapshot, dict) else None) or cover_letter

        cover_pdf_bytes = _generate_cover_letter_pdf(
            applicant_name, applicant_email, applicant_phone, applicant_location,
            company_name, role_title, cover_letter
        )
        app_letter_pdf_bytes = _generate_application_letter_pdf(
            applicant_name, applicant_email, applicant_phone, applicant_location,
            company_name, role_title, effective_app_letter
        )

        # ── 3. Build Resume PDF using CVVersionService ──
        cv_pdf_bytes = None
        try:
            from app.services.cv_version_service import CVVersionService
            cv_svc = CVVersionService(self.repo.session)
            target_cv_id = None
            if cv_snapshot and isinstance(cv_snapshot, dict) and cv_snapshot.get("cv_id"):
                try:
                    target_cv_id = int(cv_snapshot["cv_id"])
                except ValueError:
                    pass
            if not target_cv_id:
                user_cvs = await cv_svc.list(user_id)
                if user_cvs:
                    target_cv_id = int(user_cvs[0]["id"])

            if target_cv_id:
                cv_pdf_bytes = await cv_svc.export_pdf(cv_id=target_cv_id, user_id=user_id, theme_name="Sapphire")
        except Exception as cv_err:
            print(f"Resume PDF generation note: {cv_err}")

        # ── 4. Formulate Email Text & HTML Bodies ──
        subject = f"Application for {role_title} Position — {applicant_name}"
        letter_summary = cover_letter.strip() if cover_letter else f"Dear Hiring Team at {company_name},\n\nI am writing to express my strong interest in the {role_title} position at {company_name}."

        plain_body = (
            f"Dear Hiring Team at {company_name},\n\n"
            f"Please accept my formal job application for the {role_title} position.\n\n"
            f"{letter_summary}\n\n"
            f"Enclosed with this email are my official documents in PDF format:\n"
            f"- Resume_{clean_applicant_filename}.pdf\n"
            f"- Application_Letter_{clean_applicant_filename}.pdf\n"
            f"- Cover_Letter_{clean_applicant_filename}.pdf\n\n"
            f"Thank you for your time and consideration. I look forward to discussing my application.\n\n"
            f"Best regards,\n"
            f"{applicant_name}\n"
            f"{applicant_email}{f' | {applicant_phone}' if applicant_phone else ''}"
        )

        formatted_paragraphs = "".join([
            f"<p style='margin-bottom: 12px; line-height: 1.6;'>{line.strip()}</p>"
            for line in letter_summary.split("\n") if line.strip()
        ])
        html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #1e293b; line-height: 1.6; padding: 10px;">
  <p>Dear Hiring Team at {company_name},</p>
  
  <p>Please accept my formal job application for the <strong>{role_title}</strong> position.</p>

  {formatted_paragraphs}

  <p style="margin-top: 16px;"><strong>Attached PDF Documents:</strong><br/>
  - Resume_{clean_applicant_filename}.pdf<br/>
  - Application_Letter_{clean_applicant_filename}.pdf<br/>
  - Cover_Letter_{clean_applicant_filename}.pdf</p>

  <p style="margin-top: 20px;">Thank you for your time and consideration. I look forward to discussing my application with your hiring team.</p>

  <p style="margin-top: 24px;">Best regards,<br/>
  <strong>{applicant_name}</strong><br/>
  <span style="color: #475569; font-size: 13px;">{applicant_email}{f' | {applicant_phone}' if applicant_phone else ''}</span></p>
</body>
</html>"""

        # ── 5. Robust Multi-Port IPv4 SMTP & IMAP Dispatch ──
        sent_status = False
        smtp_error_msg = None

        rec_domain = recruiter_email.split("@")[-1].strip() if (recruiter_email and "@" in str(recruiter_email)) else ""
        has_smtp_creds = bool(settings.smtp_user and settings.smtp_password)

        if not settings.emails_enabled:
            smtp_error_msg = "Emails are disabled in environment settings (EMAILS_ENABLED=false)."
        elif rec_domain in ["acme.com", "example.com", "testcorp.com", "domain.com"]:
            smtp_error_msg = f"Recruiter email '{recruiter_email}' is a test domain placeholder. Logged to outbox."
        elif not recruiter_email:
            smtp_error_msg = "Recruiter email is missing."
        elif not has_smtp_creds:
            smtp_error_msg = "SMTP credentials missing: Please add SMTP_USER and SMTP_PASSWORD in environment settings."
        else:
            def _do_send_smtp(target_rec_email: str, target_rec_domain: str):
                if target_rec_domain:
                    try:
                        socket.gethostbyname(target_rec_domain)
                    except Exception:
                        pass

                msg = MIMEMultipart("mixed")
                domain = "mail.gmail.com" if "gmail" in settings.smtp_from_email else (settings.smtp_from_email.split("@")[-1] if "@" in settings.smtp_from_email else "gmail.com")
                msg["Message-ID"] = f"<{uuid.uuid4()}@{domain}>"
                msg["Date"] = formatdate(localtime=True)
                msg["MIME-Version"] = "1.0"
                msg["From"] = f"{applicant_name or settings.smtp_from_name} <{settings.smtp_from_email}>"
                msg["To"] = target_rec_email
                msg["Reply-To"] = f"{applicant_name} <{applicant_email or settings.smtp_from_email}>"
                msg["Subject"] = subject

                alt_part = MIMEMultipart("alternative")
                alt_part.attach(MIMEText(plain_body, "plain", "utf-8"))
                alt_part.attach(MIMEText(html_body, "html", "utf-8"))
                msg.attach(alt_part)

                if app_letter_pdf_bytes:
                    att_app_letter = MIMEApplication(app_letter_pdf_bytes, _subtype="pdf")
                    att_app_letter.add_header("Content-Disposition", "attachment", filename=f"Application_Letter_{clean_applicant_filename}.pdf")
                    msg.attach(att_app_letter)

                if cover_pdf_bytes:
                    att_cover = MIMEApplication(cover_pdf_bytes, _subtype="pdf")
                    att_cover.add_header("Content-Disposition", "attachment", filename=f"Cover_Letter_{clean_applicant_filename}.pdf")
                    msg.attach(att_cover)

                if cv_pdf_bytes:
                    att_cv = MIMEApplication(cv_pdf_bytes, _subtype="pdf")
                    att_cv.add_header("Content-Disposition", "attachment", filename=f"Resume_{clean_applicant_filename}.pdf")
                    msg.attach(att_cv)

                if applicant_email and applicant_email != target_rec_email:
                    msg["Bcc"] = applicant_email

                recipients = [target_rec_email]
                if applicant_email and applicant_email not in recipients:
                    recipients.append(applicant_email)
                if settings.smtp_from_email and settings.smtp_from_email not in recipients:
                    recipients.append(settings.smtp_from_email)

                smtp_pass = settings.smtp_password.replace(" ", "") if settings.smtp_password else ""

                # Multi-Strategy Dispatch (IPv4 TLS 587 -> IPv4 SSL 465 -> Standard 587 -> Standard 465)
                send_success = False
                errors = []

                # 1. Try IPv4 TLS 587
                try:
                    with IPv4SMTP(settings.smtp_host, settings.smtp_port, timeout=12) as server:
                        server.starttls()
                        server.login(settings.smtp_user, smtp_pass)
                        server.sendmail(settings.smtp_from_email, recipients, msg.as_string())
                        send_success = True
                except Exception as err1:
                    errors.append(err1)

                # 2. Try IPv4 SSL 465 fallback
                if not send_success:
                    try:
                        smtp_ssl_host = "smtp.gmail.com" if "gmail" in settings.smtp_user else settings.smtp_host
                        with IPv4SMTP_SSL(smtp_ssl_host, 465, timeout=12) as server_ssl:
                            server_ssl.login(settings.smtp_user, smtp_pass)
                            server_ssl.sendmail(settings.smtp_from_email, recipients, msg.as_string())
                            send_success = True
                    except Exception as err2:
                        errors.append(err2)

                # 3. Try Standard TLS 587 fallback
                if not send_success:
                    try:
                        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=12) as server:
                            server.starttls()
                            server.login(settings.smtp_user, smtp_pass)
                            server.sendmail(settings.smtp_from_email, recipients, msg.as_string())
                            send_success = True
                    except Exception as err3:
                        errors.append(err3)

                # 4. Try Standard SSL 465 fallback
                if not send_success:
                    try:
                        smtp_ssl_host = "smtp.gmail.com" if "gmail" in settings.smtp_user else settings.smtp_host
                        with smtplib.SMTP_SSL(smtp_ssl_host, 465, timeout=12) as server_ssl:
                            server_ssl.login(settings.smtp_user, smtp_pass)
                            server_ssl.sendmail(settings.smtp_from_email, recipients, msg.as_string())
                            send_success = True
                    except Exception as err4:
                        errors.append(err4)

                if not send_success:
                    # Select best error to present to user
                    auth_err = next((e for e in errors if isinstance(e, smtplib.SMTPAuthenticationError) or "535" in str(e) or "authentication" in str(e).lower()), None)
                    if auth_err:
                        raise Exception("Gmail SMTP Authentication failed: Please verify your SMTP_USER and ensure you are using a 16-character Gmail App Password (myaccount.google.com/apppasswords).")

                    non_net_err = next((e for e in errors if "101" not in str(e) and "unreachable" not in str(e).lower()), None)
                    if non_net_err:
                        raise non_net_err

                    if errors:
                        raise errors[0]
                    raise Exception("Failed to establish SMTP connection to email server.")

                # Save copy to IMAP Sent Mail folder
                try:
                    imap_user = settings.smtp_user
                    if imap_user and smtp_pass:
                        imap_host = "imap.gmail.com" if "gmail" in imap_user else getattr(settings, "imap_host", "imap.gmail.com")
                        try:
                            imap_server = IPv4IMAP4_SSL(imap_host, 993)
                        except Exception:
                            imap_server = imaplib.IMAP4_SSL(imap_host, 993)

                        with imap_server:
                            imap_server.login(imap_user, smtp_pass)
                            for sent_folder in ['"[Gmail]/Sent Mail"', 'Sent', 'SENT', '"Sent Messages"']:
                                try:
                                    imap_server.append(sent_folder, '\\Seen', imaplib.Time2Internaldate(time.time()), msg.as_bytes())
                                    break
                                except Exception:
                                    continue
                except Exception as imap_err:
                    print(f"IMAP Sent append note: {imap_err}")

            try:
                import asyncio
                await asyncio.to_thread(_do_send_smtp, recruiter_email, rec_domain)
                sent_status = True
            except Exception as exc:
                from app.core.security_sanitizer import sanitize_exception_message
                smtp_error_msg = sanitize_exception_message(exc, default_fallback="Application saved to Sent box outbox.")
                print(f"SMTP dispatch note: {exc}")

        # ── 6. Record outgoing application email record in DB ──
        doc = {
            "user_id": user_id,
            "from_name": f"Outbound Application to {recruiter_email or company_name}",
            "subject": subject,
            "category": "Application Sent",
            "body": plain_body,
            "read": True,
            "recommended_action": f"Follow up with {recruiter_email or company_name} in 7 days.",
            "application_id": application_id,
            "source": "smtp_sent" if sent_status else "application_dispatch"
        }
        created = await self.repo.create(doc)

        # ── 7. Create In-App Notification ──
        try:
            from app.services.notification_service import NotificationService
            from app.schemas.notification import NotificationCreate
            notif_svc = NotificationService(self.repo.session)
            if sent_status:
                notif_title = "Email Application Sent! 📧"
                notif_msg = f"Dispatched application for {role_title} at {company_name} to {recruiter_email} with attached PDF resume & cover letter."
            else:
                notif_title = "Application Outbound Logged 📧"
                notif_msg = f"Application for {role_title} at {company_name} logged: {smtp_error_msg or 'Outbound record created.'}"

            await notif_svc.create(user_id, NotificationCreate(
                title=notif_title,
                message=notif_msg,
                type="application",
                link="/applications"
            ))
        except Exception as notif_err:
            print(f"Error creating notification for application email: {notif_err}")

        res = _serialize(created)
        res["email_sent"] = sent_status
        if smtp_error_msg:
            res["smtp_error"] = smtp_error_msg
        return res

    async def sync_inbound_responses(self, user_id: int) -> dict:
        """
        Connects to candidate's Gmail via IMAP, fetches recent recruiter response emails,
        automatically matches them to candidate applications, updates application stage
        (Confirmed / Assessment / Interview / Offer), creates Interview & Calendar entries,
        and dispatches notifications.
        """
        import email
        from email.header import decode_header
        import asyncio

        user_email = settings.smtp_user
        password = settings.smtp_password.replace(" ", "") if settings.smtp_password else ""

        if not user_email or not password:
            return {"synced": False, "count": 0, "message": "IMAP credentials not configured in settings."}

        app_res = await self.repo.session.execute(
            select(Application).where(Application.user_id == user_id)
        )
        user_apps = app_res.scalars().all()
        app_map = {app.company_name.lower(): app for app in user_apps}

        synced_count = 0
        new_updates = []
        imap_error_msg = None

        def _do_imap_sync():
            nonlocal synced_count, imap_error_msg
            try:
                try:
                    mail = IPv4IMAP4_SSL("imap.gmail.com", 993)
                except Exception:
                    mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)

                mail.login(user_email, password)
                mail.select("inbox")

                status, messages = mail.search(None, "ALL")
                if status != "OK" or not messages[0]:
                    mail.logout()
                    return

                # Scan up to 50 recent messages in inbox
                msg_ids = messages[0].split()[-50:]
                for msg_id in reversed(msg_ids):
                    res, data = mail.fetch(msg_id, "(RFC822)")
                    if res != "OK":
                        continue

                    for response_part in data:
                        if isinstance(response_part, tuple):
                            msg = email.message_from_bytes(response_part[1])

                            raw_subj = msg.get("Subject", "")
                            subject = ""
                            if raw_subj:
                                decoded_seq = decode_header(raw_subj)
                                for bytes_or_str, encoding in decoded_seq:
                                    if isinstance(bytes_or_str, bytes):
                                        subject += bytes_or_str.decode(encoding or "utf-8", errors="ignore")
                                    else:
                                        subject += str(bytes_or_str)

                            from_addr = msg.get("From", "")
                            body = ""
                            if msg.is_multipart():
                                for part in msg.walk():
                                    if part.get_content_type() == "text/plain":
                                        body = part.get_payload(decode=True).decode(errors="ignore")
                                        break
                            else:
                                body = msg.get_payload(decode=True).decode(errors="ignore")

                            combined_text = (subject + " " + body + " " + from_addr).lower()

                            # Ignore mailer daemon bounces & self-sent messages
                            if any(b in combined_text for b in [
                                "mailer-daemon", "address not found", "delivery status notification",
                                "undeliverable", "failure notice", "postmaster@", "message not delivered"
                            ]):
                                continue

                            if user_email and user_email.lower() in from_addr.lower():
                                continue

                            matched_app = None

                            # 1. Match by recruiter email
                            for app in user_apps:
                                if app.recruiter_email and app.recruiter_email.lower() in from_addr.lower():
                                    matched_app = app
                                    break

                            # 2. Match by company name or role title
                            if not matched_app:
                                for comp_name, app in app_map.items():
                                    comp_clean = comp_name.split()[0]  # e.g. "coalition" from "Coalition Technologies"
                                    if comp_name in combined_text or (len(comp_clean) > 3 and comp_clean in combined_text) or (app.role.lower() in combined_text and len(app.role) > 4):
                                        matched_app = app
                                        break

                            if matched_app:
                                from app.services.email_classifier_service import EmailClassifierService
                                classified = EmailClassifierService.classify_email(subject, body, from_addr)

                                new_stage = classified.get("recommended_stage")
                                category = classified.get("category", "Application Received")
                                action = classified.get("recommended_action", "Review recruiter email.")

                                synced_count += 1
                                new_updates.append({
                                    "app": matched_app,
                                    "subject": subject,
                                    "from": from_addr,
                                    "body": body[:800],
                                    "new_stage": new_stage,
                                    "category": category,
                                    "action": action,
                                    "extracted_data": classified.get("extracted_data") or {}
                                })

                mail.logout()
            except Exception as e:
                imap_error_msg = str(e)
                print(f"IMAP sync exception: {e}")

        await asyncio.to_thread(_do_imap_sync)

        if imap_error_msg:
            return {
                "synced": False,
                "count": 0,
                "message": f"Gmail IMAP connection notice: {imap_error_msg}."
            }

        for item in new_updates:
            app = item["app"]
            if item["new_stage"] and app.stage != item["new_stage"]:
                app.stage = item["new_stage"]

            doc = {
                "user_id": user_id,
                "from_name": item["from"][:255],
                "subject": item["subject"][:255],
                "category": item["category"],
                "body": item["body"],
                "read": False,
                "recommended_action": item["action"],
                "application_id": app.id,
                "source": "imap_sync"
            }
            await self.repo.create(doc)

            # ── Automatically create Interview & Calendar Event if Interview or Assessment stage ──
            stage_str = str(item["new_stage"] or "").lower()
            if any(k in stage_str for k in ["interview", "technical", "hr", "final", "assessment"]):
                ext_data = item.get("extracted_data") or {}
                meeting_link = ext_data.get("meeting_link") or "Online Video Call"

                sched_dt = datetime.now(timezone.utc) + timedelta(days=3)
                ev_date = date.today() + timedelta(days=3)

                existing_int = await self.repo.session.execute(
                    select(Interview).where(
                        Interview.user_id == user_id,
                        Interview.application_id == app.id,
                        Interview.status == "scheduled"
                    )
                )
                if not existing_int.scalars().first():
                    new_interview = Interview(
                        user_id=user_id,
                        application_id=app.id,
                        type=item["category"] if "Interview" in item["category"] else "Technical",
                        scheduled_at=sched_dt,
                        location=meeting_link,
                        status="scheduled",
                        post_interview_notes=f"Captured from recruiter email: {item['subject']}"
                    )
                    self.repo.session.add(new_interview)

                    new_cal_event = CalendarEvent(
                        user_id=user_id,
                        application_id=app.id,
                        title=f"📅 Interview: {app.role} at {app.company_name}",
                        type="Interview",
                        date=ev_date,
                        time="10:00 AM",
                        color="blue"
                    )
                    self.repo.session.add(new_cal_event)

            try:
                from app.services.notification_service import NotificationService
                from app.schemas.notification import NotificationCreate
                notif_svc = NotificationService(self.repo.session)
                await notif_svc.create(user_id, NotificationCreate(
                    title=f"📬 Recruiter Update from {app.company_name}!",
                    message=f"Received: {item['subject']}. Stage updated to {app.stage}.",
                    type="application",
                    link="/applications"
                ))
            except Exception:
                pass

        await self.repo.session.commit()

        return {
            "synced": True,
            "count": synced_count,
            "message": f"Successfully synced inbox. Found {synced_count} recruiter response updates."
        }

    async def batch_send_applications(self, user_id: int, application_ids: List[int]) -> dict:
        """
        Processes a queue of applications and dispatches emails sequentially
        with rate-limiting delays to prevent spam domain blacklisting.
        """
        import asyncio

        dispatched = []
        errors = []

        stmt = select(Application).where(
            Application.user_id == user_id,
            Application.id.in_(application_ids)
        )
        res = await self.repo.session.execute(stmt)
        apps = res.scalars().all()

        for app in apps:
            recruiter_email = app.recruiter_email or f"careers@{app.company_name.lower().replace(' ', '')}.com"
            cover_letter = app.notes or f"Dear Hiring Team at {app.company_name},\n\nPlease accept my application for the {app.role} position."

            try:
                out = await self.send_application_email(
                    user_id=user_id,
                    recruiter_email=recruiter_email,
                    company_name=app.company_name,
                    role_title=app.role,
                    cover_letter=cover_letter,
                    cv_snapshot=app.cv_snapshot,
                    app_letter_snapshot=getattr(app, "app_letter_snapshot", None),
                    application_id=app.id
                )
                if out.get("email_sent"):
                    dispatched.append(app.id)
                else:
                    errors.append({"app_id": app.id, "error": out.get("smtp_error", "Unknown error")})
            except Exception as e:
                errors.append({"app_id": app.id, "error": str(e)})

            await asyncio.sleep(1.0)

        return {
            "total_requested": len(application_ids),
            "sent_count": len(dispatched),
            "failed_count": len(errors),
            "dispatched_ids": dispatched,
            "errors": errors
        }
