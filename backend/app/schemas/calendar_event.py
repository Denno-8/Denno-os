from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class CalendarEventCreate(BaseModel):
    title: str = Field(..., min_length=1)
    type: str = "Task"
    date: date
    time: str = ""
    color: str = "blue"
    application_id: Optional[str] = None


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    date: Optional[date] = None
    time: Optional[str] = None
    color: Optional[str] = None


class CalendarEventOut(BaseModel):
    id: str
    title: str
    type: str
    date: date
    time: str
    color: str
    application_id: str | None = None
    created_at: datetime
