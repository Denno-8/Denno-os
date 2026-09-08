from datetime import datetime
from pydantic import BaseModel, Field


class EmailCreate(BaseModel):
    from_name: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1)
    category: str = "Application Received"
    body: str = ""
    recommended_action: str = ""
    application_id: str | None = None


class EmailUpdate(BaseModel):
    read: bool | None = None
    category: str | None = None
    application_id: str | None = None


class EmailOut(BaseModel):
    id: str
    from_name: str
    subject: str
    category: str
    body: str
    received_at: datetime
    read: bool
    recommended_action: str
    application_id: str | None = None
    source: str
    created_at: datetime
