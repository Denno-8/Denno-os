from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.common import PyObjectId


class CalendarEventModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId

    title: str
    type: str = "Task"  # Interview | Assessment | Deadline | Task | Learning | Reminder
    date: date
    time: str = ""
    color: str = "blue"
    application_id: Optional[PyObjectId] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
