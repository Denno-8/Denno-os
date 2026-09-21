from datetime import datetime
from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info"  # info | application | email | job_source | match
    link: str = ""


class NotificationOut(BaseModel):
    id: str
    title: str = ""
    message: str = ""
    type: str = "info"
    link: str = ""
    read: bool = False
    created_at: datetime | str | None = None
