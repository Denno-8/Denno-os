from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, extract
from app.repositories.calendar_event_repository import CalendarEventRepository
from app.schemas.calendar_event import CalendarEventCreate, CalendarEventUpdate
from app.models.sqlalchemy_models import Interview, Application


def _serialize(event) -> dict:
    type_val = getattr(event, "type", None) or getattr(event, "color", "Task")
    return {
        "id": str(event.id),
        "title": event.title,
        "type": type_val,
        "date": event.date if hasattr(event, "date") else getattr(event, "scheduled_at", date.today()),
        "time": getattr(event, "time", None) or getattr(event, "start_time", "") or "",
        "color": getattr(event, "color", "blue") or "blue",
        "description": getattr(event, "description", "") or "",
        "application_id": str(event.application_id) if getattr(event, "application_id", None) else None,
        "location": getattr(event, "location", "") or "",
        "notes": getattr(event, "notes", "") or "",
        "created_at": getattr(event, "created_at", datetime.now()),
        "updated_at": getattr(event, "updated_at", datetime.now()),
    }


class CalendarEventService:
    def __init__(self, db: AsyncSession):
        self.repo = CalendarEventRepository(db)

    async def create(self, user_id: int, payload: CalendarEventCreate) -> dict:
        doc = payload.model_dump(exclude_none=True)
        doc["user_id"] = user_id
        if "application_id" in doc and doc["application_id"] is not None:
            try:
                doc["application_id"] = int(doc["application_id"])
            except ValueError:
                doc["application_id"] = None
        created = await self.repo.create(doc)
        return _serialize(created)

    async def list(self, user_id: int, month: int | None, year: int | None) -> list[dict]:
        # 1. User created calendar events
        events = await self.repo.list_for_user(user_id, month, year)
        result_list = [_serialize(event) for event in events]

        # 2. Unified Auto-Sync: Fetch scheduled interviews for candidate
        try:
            query = select(Interview, Application.company_name, Application.role)\
                .outerjoin(Application, Interview.application_id == Application.id)\
                .where(Interview.user_id == user_id)
            
            if month and year:
                query = query.where(
                    (extract("month", Interview.scheduled_at) == month) &
                    (extract("year", Interview.scheduled_at) == year)
                )

            res = await self.repo.session.execute(query)
            rows = res.all()
            for interview_obj, company_name, role_title in rows:
                sch = interview_obj.scheduled_at
                dt_str = sch.strftime("%Y-%m-%d") if hasattr(sch, "strftime") else str(sch).split("T")[0]
                time_str = sch.strftime("%I:%M %p") if hasattr(sch, "strftime") else ""
                
                comp = company_name or "Target Company"
                title_str = f"Interview: {interview_obj.type} ({comp})"
                if role_title:
                    title_str += f" - {role_title}"

                result_list.append({
                    "id": f"interview-{interview_obj.id}",
                    "title": title_str,
                    "type": "Interview",
                    "date": dt_str,
                    "time": time_str,
                    "color": "blue",
                    "description": f"Scheduled {interview_obj.type} interview for {role_title or 'position'} at {comp}.",
                    "application_id": str(interview_obj.application_id) if interview_obj.application_id else None,
                    "location": interview_obj.location or "Video Call / Phone",
                    "notes": interview_obj.post_interview_notes or "",
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                })
        except Exception as exc:
            print(f"Calendar interview auto-sync note: {exc}")

        # Sort combined results chronologically by date
        result_list.sort(key=lambda x: (str(x["date"]), str(x.get("time", ""))))
        return result_list

    async def update(self, event_id: int, user_id: int, payload: CalendarEventUpdate) -> dict | None:
        patch = payload.model_dump(exclude_none=True)
        if "application_id" in patch and patch["application_id"] is not None:
            try:
                patch["application_id"] = int(patch["application_id"])
            except ValueError:
                patch["application_id"] = None
        
        # Handle string IDs vs integer IDs
        try:
            eid = int(event_id)
            event = await self.repo.update(eid, user_id, patch)
            return _serialize(event) if event else None
        except ValueError:
            return None

    async def delete(self, event_id: str | int, user_id: int) -> bool:
        try:
            eid = int(event_id)
            return await self.repo.delete(eid, user_id)
        except ValueError:
            return False

    async def generate_ics_export(self, user_id: int, month: int | None = None, year: int | None = None) -> str:
        """Generates standard iCalendar (.ics) file contents for export into Google Calendar / Apple Calendar."""
        events = await self.list(user_id, month, year)
        
        ics_lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Denno Career OS//Calendar Export//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "X-WR-CALNAME:Denno Career Schedule",
        ]

        for ev in events:
            dt_raw = str(ev["date"]).replace("-", "")
            time_raw = str(ev.get("time", "")).strip()
            
            # Format DTSTART
            dtstart = f"{dt_raw}T090000Z"
            if ":" in time_raw:
                parts = time_raw.split(":")
                hh = parts[0].zfill(2)
                mm = parts[1][:2].zfill(2)
                dtstart = f"{dt_raw}T{hh}{mm}00Z"

            summary = ev["title"].replace("\n", " ")
            desc = (ev.get("description") or f"Denno Career Event: {ev['type']}").replace("\n", "\\n")
            loc = (ev.get("location") or "").replace("\n", " ")

            ics_lines.extend([
                "BEGIN:VEVENT",
                f"UID:denno-event-{ev['id']}@denno-os.com",
                f"DTSTAMP:{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}",
                f"DTSTART:{dtstart}",
                f"SUMMARY:{summary}",
                f"DESCRIPTION:{desc}",
                f"LOCATION:{loc}",
                f"STATUS:CONFIRMED",
                "END:VEVENT"
            ])

        ics_lines.append("END:VCALENDAR")
        return "\r\n".join(ics_lines)
