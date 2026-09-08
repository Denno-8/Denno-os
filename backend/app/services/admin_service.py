"""
Admin service — business logic for platform-wide admin operations.
Supports filtering and multi-format exports (Excel, PDF, Word).
"""
import io
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.repositories.admin_repository import AdminRepository


def _serialize_user(u, app_count: int = 0) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "first_name": u.first_name or "",
        "last_name": u.last_name or "",
        "role": u.role or "user",
        "is_active": getattr(u, "is_active", True),
        "title": u.title or "",
        "location": u.location or "",
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "application_count": app_count,
    }


def _serialize_job(j) -> dict:
    return {
        "id": j.id,
        "title": j.title,
        "company_name": j.company_name,
        "mode": j.mode,
        "level": j.level,
        "employment_type": j.employment_type,
        "salary_min": j.salary_min,
        "salary_max": j.salary_max,
        "currency": j.currency,
        "is_hot": j.is_hot,
        "is_expired": getattr(j, "is_expired", False),
        "source_url": j.source_url,
        "match_score": j.match_score,
        "ats_score": j.ats_score,
        "deadline": j.deadline.isoformat() if getattr(j, "deadline", None) else None,
        "created_at": j.created_at.isoformat() if getattr(j, "created_at", None) else None,
    }


def _serialize_company(c) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "sector": c.sector,
        "location": c.location,
        "tier": c.tier,
        "open_roles_count": c.open_roles_count,
        "career_url": c.career_url,
        "contact_email": c.contact_email,
        "ats_platform": c.ats_platform,
        "created_at": c.created_at.isoformat() if getattr(c, "created_at", None) else None,
    }


class AdminService:
    def __init__(self, db: AsyncSession):
        self.repo = AdminRepository(db)

    # ─── Users ────────────────────────────────────────────────────────────────
    async def list_users(self, skip: int, limit: int, q: str, role: str = "", active_status: str = "") -> list[dict]:
        users = await self.repo.list_users(skip, limit, q, role, active_status)
        result = []
        for u in users:
            app_count = await self.repo.user_application_count(u.id)
            result.append(_serialize_user(u, app_count))
        return result

    async def get_user(self, user_id: int) -> dict:
        u = await self.repo.get_user(user_id)
        if not u:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
        app_count = await self.repo.user_application_count(user_id)
        return _serialize_user(u, app_count)

    async def update_user_role(self, user_id: int, role: str) -> dict:
        if role not in ("user", "admin"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Role must be 'user' or 'admin'")
        u = await self.repo.update_user(user_id, {"role": role})
        if not u:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
        return _serialize_user(u)

    async def suspend_user(self, user_id: int, suspend: bool) -> dict:
        u = await self.repo.update_user(user_id, {"is_active": not suspend})
        if not u:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
        return _serialize_user(u)

    async def delete_user(self, user_id: int) -> bool:
        deleted = await self.repo.delete_user(user_id)
        if not deleted:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
        return True

    async def promote_by_email(self, email: str) -> dict:
        u = await self.repo.get_user_by_email(email)
        if not u:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"No user found with email: {email}")
        updated = await self.repo.update_user(u.id, {"role": "admin"})
        return _serialize_user(updated)

    # ─── Analytics ────────────────────────────────────────────────────────────
    async def platform_analytics(self) -> dict:
        return await self.repo.platform_analytics()

    # ─── Jobs ─────────────────────────────────────────────────────────────────
    async def list_all_jobs(
        self, skip: int, limit: int, mode: str = "", level: str = "", is_expired: str = ""
    ) -> list[dict]:
        jobs = await self.repo.list_all_jobs(skip, limit, mode, level, is_expired)
        return [_serialize_job(j) for j in jobs]

    async def delete_job(self, job_id: int) -> bool:
        deleted = await self.repo.delete_job(job_id)
        if not deleted:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
        return True

    # ─── Companies ────────────────────────────────────────────────────────────
    async def list_all_companies(self, skip: int, limit: int, tier: str = "", sector: str = "") -> list[dict]:
        companies = await self.repo.list_all_companies(skip, limit, tier, sector)
        return [_serialize_company(c) for c in companies]

    async def delete_company(self, company_id: int) -> bool:
        deleted = await self.repo.delete_company(company_id)
        if not deleted:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Company not found")
        return True

    # ─── Export Engine (Excel, PDF, Word) ──────────────────────────────────────
    async def export_data(self, resource: str, format_type: str) -> tuple[bytes, str, str]:
        """Returns (file_bytes, media_type, filename)."""
        data: List[dict] = []
        title = ""
        headers: List[str] = []

        if resource == "users":
            data = await self.list_users(0, 1000, "")
            title = "Platform Users Report"
            headers = ["ID", "Email", "First Name", "Last Name", "Role", "Status", "Title", "Applications", "Joined"]
        elif resource == "jobs":
            data = await self.list_all_jobs(0, 1000)
            title = "Platform Jobs Listings Report"
            headers = ["ID", "Job Title", "Company", "Mode", "Level", "Type", "Salary", "Match Score", "Expired"]
        elif resource == "companies":
            data = await self.list_all_companies(0, 1000)
            title = "Platform Companies Tracked Report"
            headers = ["ID", "Company Name", "Sector", "Location", "Tier", "Open Roles", "ATS Platform", "Contact Email"]
        else:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid resource requested")

        fmt = format_type.lower()
        if fmt in ["excel", "xlsx"]:
            import openpyxl
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = resource.capitalize()
            ws.append([title])
            ws.append([])
            ws.append(headers)

            for item in data:
                if resource == "users":
                    ws.append([item["id"], item["email"], item["first_name"], item["last_name"], item["role"], "Active" if item["is_active"] else "Suspended", item["title"], item["application_count"], item["created_at"]])
                elif resource == "jobs":
                    ws.append([item["id"], item["title"], item["company_name"], item["mode"], item["level"], item["employment_type"], f"{item['currency']} {item['salary_min']}-{item['salary_max']}", item["match_score"], "Yes" if item.get("is_expired") else "No"])
                elif resource == "companies":
                    ws.append([item["id"], item["name"], item["sector"], item["location"], item["tier"], item["open_roles_count"], item["ats_platform"], item["contact_email"]])

            buf = io.BytesIO()
            wb.save(buf)
            return buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", f"admin_{resource}.xlsx"

        elif fmt == "pdf":
            from reportlab.lib.pagesizes import letter, landscape
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.lib import colors

            buf = io.BytesIO()
            doc = SimpleDocTemplate(buf, pagesize=landscape(letter), rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
            story = []
            styles = getSampleStyleSheet()

            story.append(Paragraph(f"<b>{title}</b>", styles["Heading1"]))
            story.append(Spacer(1, 12))

            table_rows = [headers]
            for item in data:
                if resource == "users":
                    table_rows.append([str(item["id"]), item["email"][:25], item["first_name"], item["last_name"], item["role"], "Active" if item["is_active"] else "Suspended", item["title"][:20], str(item["application_count"]), str(item["created_at"])[:10]])
                elif resource == "jobs":
                    table_rows.append([str(item["id"]), item["title"][:25], item["company_name"][:20], item["mode"], item["level"], item["employment_type"], f"{item['salary_min']}-{item['salary_max']}", f"{item['match_score']}%", "Yes" if item.get("is_expired") else "No"])
                elif resource == "companies":
                    table_rows.append([str(item["id"]), item["name"][:25], item["sector"][:20], item["location"][:15], f"Tier {item['tier']}", str(item["open_roles_count"]), item["ats_platform"][:15], item["contact_email"][:20]])

            t = Table(table_rows)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,0), 6),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ]))
            story.append(t)
            doc.build(story)
            return buf.getvalue(), "application/pdf", f"admin_{resource}.pdf"

        elif fmt in ["word", "docx"]:
            import docx
            doc = docx.Document()
            doc.add_heading(title, 0)

            table = doc.add_table(rows=1, cols=len(headers))
            hdr_cells = table.rows[0].cells
            for i, h in enumerate(headers):
                hdr_cells[i].text = h

            for item in data:
                row_cells = table.add_row().cells
                if resource == "users":
                    vals = [str(item["id"]), item["email"], item["first_name"], item["last_name"], item["role"], "Active" if item["is_active"] else "Suspended", item["title"], str(item["application_count"]), str(item["created_at"])[:10]]
                elif resource == "jobs":
                    vals = [str(item["id"]), item["title"], item["company_name"], item["mode"], item["level"], item["employment_type"], f"{item['salary_min']}-{item['salary_max']}", f"{item['match_score']}%", "Yes" if item.get("is_expired") else "No"]
                elif resource == "companies":
                    vals = [str(item["id"]), item["name"], item["sector"], item["location"], f"Tier {item['tier']}", str(item["open_roles_count"]), item["ats_platform"], item["contact_email"]]
                
                for idx, v in enumerate(vals):
                    row_cells[idx].text = v

            buf = io.BytesIO()
            doc.save(buf)
            return buf.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", f"admin_{resource}.docx"

        else:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Format must be excel, pdf, or word")

    # ─── System Email & SMTP Settings ──────────────────────────────────────────
    async def get_email_settings(self) -> dict:
        from app.core.config import settings
        return {
            "smtp_host": settings.smtp_host,
            "smtp_port": settings.smtp_port,
            "smtp_user": settings.smtp_user,
            "smtp_password_set": bool(settings.smtp_password),
            "smtp_from_email": settings.smtp_from_email,
            "smtp_from_name": settings.smtp_from_name,
            "emails_enabled": settings.emails_enabled,
        }

    async def update_email_settings(self, payload: dict) -> dict:
        from app.core.config import settings
        if "smtp_host" in payload and payload["smtp_host"] is not None:
            settings.smtp_host = str(payload["smtp_host"])
        if "smtp_port" in payload and payload["smtp_port"] is not None:
            settings.smtp_port = int(payload["smtp_port"])
        if "smtp_user" in payload and payload["smtp_user"] is not None:
            settings.smtp_user = str(payload["smtp_user"])
        if "smtp_password" in payload and payload["smtp_password"]:
            settings.smtp_password = str(payload["smtp_password"])
        if "smtp_from_email" in payload and payload["smtp_from_email"] is not None:
            settings.smtp_from_email = str(payload["smtp_from_email"])
        if "smtp_from_name" in payload and payload["smtp_from_name"] is not None:
            settings.smtp_from_name = str(payload["smtp_from_name"])
        if "emails_enabled" in payload and payload["emails_enabled"] is not None:
            settings.emails_enabled = bool(payload["emails_enabled"])
        return await self.get_email_settings()

    async def test_smtp_connection(self, target_email: str | None = None) -> dict:
        import smtplib
        from email.mime.text import MIMEText
        from app.core.config import settings

        if not settings.smtp_host or not settings.smtp_port:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SMTP host and port must be configured before testing connection."
            )

        recipient = target_email or settings.smtp_from_email or "admin@denno.app"
        msg = MIMEText(
            f"Hello,\n\nThis is an automated diagnostic ping sent from your Denno Career OS Admin Settings Email Setup.\n\n"
            f"Configuration status: Successful TLS handshake & authentication test.\n"
            f"Sender Name: {settings.smtp_from_name}\n"
            f"Sender Email: {settings.smtp_from_email}\n",
            "plain"
        )
        msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        msg["To"] = recipient
        msg["Subject"] = "[Denno Admin] System Email SMTP Test Connection"

        try:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=8) as server:
                server.starttls()
                if settings.smtp_user and settings.smtp_password:
                    server.login(settings.smtp_user, settings.smtp_password)
                if recipient:
                    server.sendmail(settings.smtp_from_email or recipient, [recipient], msg.as_string())
            return {
                "success": True,
                "message": f"SMTP handshake and test email successfully dispatched to {recipient}",
                "recipient": recipient
            }
        except Exception as exc:
            return {
                "success": False,
                "message": f"SMTP Connection Failed: {str(exc)}",
                "recipient": recipient
            }

