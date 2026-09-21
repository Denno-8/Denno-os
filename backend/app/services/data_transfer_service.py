"""
Cross-cutting export/import facade. Deliberately composes the existing,
already-tested per-resource services (ApplicationService, NoteService, ...)
rather than querying the DB directly, so every export/import goes through
the same validation and serialization the rest of the app already relies on.
"""
import csv
import io
import json
from datetime import date, datetime
from typing import Any

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
import pdfplumber
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import ValidationError

from app.schemas.data_transfer import LIST_FIELDS
from app.schemas.application import ApplicationCreate
from app.schemas.note import NoteCreate
from app.schemas.goal import GoalCreate
from app.schemas.recruiter import RecruiterCreate
from app.schemas.cv_version import CVVersionCreate
from app.schemas.company import CompanyCreate
from app.schemas.job import JobCreate
from app.schemas.interview import InterviewCreate
from app.schemas.email import EmailCreate

from app.services.application_service import ApplicationService
from app.services.company_service import CompanyService
from app.services.job_service import JobService
from app.services.note_service import NoteService
from app.services.goal_service import GoalService
from app.services.recruiter_service import RecruiterService
from app.services.cv_version_service import CVVersionService
from app.services.interview_service import InterviewService
from app.services.email_service import EmailService

# resource -> (Create schema, requires user_id)
_CREATE_SCHEMAS: dict[str, tuple[type, bool]] = {
    "applications": (ApplicationCreate, True),
    "notes": (NoteCreate, True),
    "goals": (GoalCreate, True),
    "recruiters": (RecruiterCreate, True),
    "cv": (CVVersionCreate, True),
    "interviews": (InterviewCreate, True),
    "emails": (EmailCreate, True),
    "companies": (CompanyCreate, False),
    "jobs": (JobCreate, False),
}


def _json_safe(value: Any) -> Any:
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe(v) for v in value]
    return value


class DataTransferService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.applications = ApplicationService(session)
        self.companies = CompanyService(session)
        self.jobs = JobService(session)
        self.notes = NoteService(session)
        self.goals = GoalService(session)
        self.recruiters = RecruiterService(session)
        self.cv_versions = CVVersionService(session)
        self.interviews = InterviewService(session)
        self.emails = EmailService(session)

    # ── EXPORT ────────────────────────────────────────────────────────
    async def export(self, resource: str, user_id: int) -> list[dict]:
        if resource == "applications":
            records = await self.applications.list(user_id, None, 0, 1000)
        elif resource == "notes":
            records = await self.notes.list(user_id, None, None)
        elif resource == "goals":
            records = await self.goals.list(user_id)
        elif resource == "recruiters":
            records = await self.recruiters.list(user_id, None)
        elif resource == "cv":
            records = await self.cv_versions.list(user_id)
        elif resource == "interviews":
            records = await self.interviews.list(user_id, False)
        elif resource == "emails":
            records = await self.emails.list(user_id, False, 0, 1000)
        elif resource == "companies":
            records = await self.companies.list(None, None, 0, 1000)
        elif resource == "jobs":
            records = await self.jobs.list(None, None, None, 0, 1000)
        else:
            raise ValueError(f"Unknown export resource: {resource}")
        
        # Convert ORM objects or dicts to json-safe dicts, redacting sensitive credential fields
        SENSITIVE_FIELDS = {"password_hash", "smtp_password", "two_fa_secret"}
        result = []
        for r in records:
            if hasattr(r, '__dict__'):
                # SQLAlchemy ORM object
                record_dict = {k: v for k, v in r.__dict__.items() if not k.startswith('_') and k not in SENSITIVE_FIELDS}
            elif isinstance(r, dict):
                record_dict = {k: v for k, v in r.items() if k not in SENSITIVE_FIELDS}
            else:
                record_dict = r
            result.append(_json_safe(record_dict))
        return result

    def to_json_bytes(self, records: list[dict]) -> bytes:
        return json.dumps(records, indent=2).encode("utf-8")

    def to_csv_bytes(self, records: list[dict]) -> bytes:
        if not records:
            return b""
        flat_rows = []
        fieldnames: list[str] = []
        for r in records:
            row = {}
            for k, v in r.items():
                row[k] = json.dumps(v) if isinstance(v, (list, dict)) else v
                if k not in fieldnames:
                    fieldnames.append(k)
            flat_rows.append(row)

        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(flat_rows)
        return buf.getvalue().encode("utf-8")

    def to_excel_bytes(self, records: list[dict], resource: str) -> bytes:
        """Serialize records to an .xlsx workbook with styled header row."""
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = resource.capitalize()

        if not records:
            buf = io.BytesIO()
            wb.save(buf)
            return buf.getvalue()

        # Flatten list/dict values to JSON strings (same as CSV)
        fieldnames: list[str] = []
        flat_rows: list[dict] = []
        for r in records:
            row: dict = {}
            for k, v in r.items():
                row[k] = json.dumps(v) if isinstance(v, (list, dict)) else v
                if k not in fieldnames:
                    fieldnames.append(k)
            flat_rows.append(row)

        # Header row — styled
        header_fill = PatternFill("solid", fgColor="1E3A5F")
        header_font = Font(bold=True, color="FFFFFF")
        for col_idx, name in enumerate(fieldnames, start=1):
            cell = ws.cell(row=1, column=col_idx, value=name)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center")

        # Data rows
        for row_idx, row in enumerate(flat_rows, start=2):
            for col_idx, name in enumerate(fieldnames, start=1):
                ws.cell(row=row_idx, column=col_idx, value=row.get(name))

        # Auto-fit column widths (best-effort)
        for col in ws.columns:
            max_len = max((len(str(cell.value or "")) for cell in col), default=0)
            ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 50)

        buf = io.BytesIO()
        wb.save(buf)
        return buf.getvalue()

    def to_pdf_bytes(self, records: list[dict], resource: str) -> bytes:
        """Serialize records to a PDF table using ReportLab."""
        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=landscape(A4),
            leftMargin=1 * cm,
            rightMargin=1 * cm,
            topMargin=1.5 * cm,
            bottomMargin=1.5 * cm,
        )
        styles = getSampleStyleSheet()
        elements = []

        # Title
        title = Paragraph(f"<b>Denno – {resource.capitalize()} Export</b>", styles["Title"])
        elements.append(title)
        elements.append(Spacer(1, 0.4 * cm))

        if not records:
            elements.append(Paragraph("No records found.", styles["Normal"]))
            doc.build(elements)
            return buf.getvalue()

        # Flatten
        fieldnames: list[str] = []
        flat_rows: list[list] = []
        for r in records:
            row: list = []
            for k, v in r.items():
                if k not in fieldnames:
                    fieldnames.append(k)
                row.append(str(json.dumps(v) if isinstance(v, (list, dict)) else (v if v is not None else "")))
            flat_rows.append(row)

        header = [Paragraph(f"<b>{h}</b>", styles["Normal"]) for h in fieldnames]
        table_data = [header] + flat_rows

        col_count = len(fieldnames)
        usable_width = landscape(A4)[0] - 2 * cm
        col_width = usable_width / col_count

        t = Table(table_data, colWidths=[col_width] * col_count, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A5F")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CCCCCC")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F7FB")]),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(t)

        doc.build(elements)
        return buf.getvalue()

    # ── IMPORT ────────────────────────────────────────────────────────
    async def import_records(self, resource: str, user_id: int, records: list[dict]) -> tuple[int, list[str]]:
        if resource not in _CREATE_SCHEMAS:
            raise ValueError(f"Import not supported for resource: {resource}")

        schema_cls, _needs_user = _CREATE_SCHEMAS[resource]
        imported = 0
        errors: list[str] = []

        READ_ONLY_KEYS = {
            "id", "user_id", "created_at", "updated_at", "times_used", "last_used_at",
            "email_sent", "smtp_error", "conflict_warning", "has_conflict"
        }

        for i, raw_record in enumerate(records):
            # Strip read-only system fields
            raw = {k: v for k, v in raw_record.items() if k not in READ_ONLY_KEYS and v is not None}

            # Smart fallbacks for common user export/import fields
            if resource == "applications":
                if "company_name" not in raw or not str(raw.get("company_name")).strip():
                    raw["company_name"] = "Imported Company"
                if "role" not in raw or not str(raw.get("role")).strip():
                    raw["role"] = "Software Developer"
                if "date_applied" not in raw or not raw["date_applied"]:
                    raw["date_applied"] = date.today().isoformat()
                if "stage" in raw and isinstance(raw["stage"], str):
                    raw["stage"] = raw["stage"].lower().strip()
            elif resource == "notes":
                if "title" not in raw or not str(raw.get("title")).strip():
                    raw["title"] = "Untitled Note"
            elif resource == "goals":
                if "label" not in raw or not str(raw.get("label")).strip():
                    raw["label"] = "Untitled Goal"
            elif resource == "cv":
                if "name" not in raw or not str(raw.get("name")).strip():
                    raw["name"] = "Imported CV"
            elif resource == "interviews":
                if "scheduled_at" not in raw or not raw["scheduled_at"]:
                    raw["scheduled_at"] = datetime.now(timezone.utc).isoformat()
            elif resource == "emails":
                if "from_name" not in raw or not str(raw.get("from_name")).strip():
                    raw["from_name"] = "Recruiter"
                if "subject" not in raw or not str(raw.get("subject")).strip():
                    raw["subject"] = "Application Update"
            elif resource == "jobs":
                if "title" not in raw or not str(raw.get("title")).strip():
                    raw["title"] = "Software Engineer"
                if "company_name" not in raw or not str(raw.get("company_name")).strip():
                    raw["company_name"] = "Tech Company"

            try:
                payload = schema_cls(**raw)
            except ValidationError as e:
                first = e.errors()[0]
                errors.append(f"row {i+1}: {first['msg']} (field: {first['loc']})")
                continue

            try:
                if resource == "applications":
                    await self.applications.create(user_id, payload)
                elif resource == "notes":
                    await self.notes.create(user_id, payload)
                elif resource == "goals":
                    await self.goals.create(user_id, payload)
                elif resource == "recruiters":
                    await self.recruiters.create(user_id, payload)
                elif resource == "cv":
                    await self.cv_versions.create(user_id, payload)
                elif resource == "interviews":
                    await self.interviews.create(user_id, payload)
                elif resource == "emails":
                    await self.emails.create(user_id, payload)
                elif resource == "companies":
                    await self.companies.create(payload)
                elif resource == "jobs":
                    await self.jobs.create(payload)
                imported += 1
            except Exception as e:  # noqa: BLE001 — surface any create-time failure per-row
                errors.append(f"row {i+1}: {e}")

        await self.session.commit()
        return imported, errors

    @staticmethod
    def _parse_cell_value(k: str, v: Any, list_fields: set[str]) -> Any:
        if v is None:
            return None
        if isinstance(v, str):
            v_str = v.strip()
            if v_str == "" or v_str.lower() in ("null", "none"):
                return None
            if (v_str.startswith("[") and v_str.endswith("]")) or (v_str.startswith("{") and v_str.endswith("}")):
                try:
                    return json.loads(v_str)
                except Exception:
                    pass
            if k in list_fields:
                return [s.strip() for s in v_str.split(",") if s.strip()]
            return v_str
        return v

    @classmethod
    def parse_csv(cls, content: str, resource: str) -> list[dict]:
        list_fields = LIST_FIELDS.get(resource, set())
        rows = []
        for row in csv.DictReader(io.StringIO(content)):
            cleaned = {}
            for k, v in row.items():
                parsed_val = cls._parse_cell_value(k, v, list_fields)
                if parsed_val is not None:
                    cleaned[k] = parsed_val
            if cleaned:
                rows.append(cleaned)
        return rows

    @classmethod
    def parse_excel(cls, content: bytes, resource: str) -> list[dict]:
        list_fields = LIST_FIELDS.get(resource, set())
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        ws = wb.active

        rows_iter = ws.iter_rows(values_only=True)
        try:
            headers = [str(h).strip() if h is not None else "" for h in next(rows_iter)]
        except StopIteration:
            return []

        rows = []
        for raw_row in rows_iter:
            row: dict = {}
            for header, cell_val in zip(headers, raw_row):
                if not header:
                    continue
                parsed_val = cls._parse_cell_value(header, cell_val, list_fields)
                if parsed_val is not None:
                    row[header] = parsed_val
            if row:
                rows.append(row)
        return rows

    @classmethod
    def parse_pdf(cls, content: bytes, resource: str) -> list[dict]:
        list_fields = LIST_FIELDS.get(resource, set())
        headers: list[str] = []
        rows: list[dict] = []

        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table:
                        continue
                    if not headers:
                        headers = [str(c).strip() if c else "" for c in table[0]]
                        data_rows = table[1:]
                    else:
                        data_rows = table

                    for raw_row in data_rows:
                        row: dict = {}
                        for header, cell_val in zip(headers, raw_row):
                            if not header:
                                continue
                            parsed_val = cls._parse_cell_value(header, cell_val, list_fields)
                            if parsed_val is not None:
                                row[header] = parsed_val
                        if row:
                            rows.append(row)

        return rows

