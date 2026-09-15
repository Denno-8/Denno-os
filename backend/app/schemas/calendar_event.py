from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


from pydantic import BaseModel, Field, field_validator
from typing import Any

def _parse_flex_date(v: Any) -> date:
    if isinstance(v, date):
        return v
    if isinstance(v, str):
        v = v.strip()
        if not v:
            return date.today()
        # ISO format YYYY-MM-DD
        if len(v) >= 10 and v[4] == "-" and v[7] == "-":
            return date.fromisoformat(v[:10])
        # DD/MM/YYYY format
        if "/" in v:
            parts = v.split("/")
            if len(parts) == 3:
                return date(int(parts[2]), int(parts[1]), int(parts[0]))
        # DD-MM-YYYY format
        if "-" in v:
            parts = v.split("-")
            if len(parts) == 3 and len(parts[0]) <= 2:
                return date(int(parts[2]), int(parts[1]), int(parts[0]))
    return v


class CalendarEventCreate(BaseModel):
    title: str = Field(..., min_length=1)
    type: str = "Task"
    date: date
    time: str = ""
    color: str = "blue"
    application_id: Optional[str] = None

    @field_validator("date", mode="before")
    @classmethod
    def parse_date_flex(cls, v: Any) -> date:
        return _parse_flex_date(v)


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    date: Optional[date] = None
    time: Optional[str] = None
    color: Optional[str] = None

    @field_validator("date", mode="before")
    @classmethod
    def parse_date_flex(cls, v: Any) -> Optional[date]:
        return _parse_flex_date(v) if v is not None else None


class CalendarEventOut(BaseModel):
    id: str
    title: str
    type: str = "Task"
    date: date
    time: str = ""
    color: str = "blue"
    description: Optional[str] = ""
    location: Optional[str] = ""
    notes: Optional[str] = ""
    application_id: Optional[str] = None
    created_at: Optional[datetime] = None

