from datetime import datetime
from pydantic import BaseModel, Field


class RecruiterCreate(BaseModel):
    name: str = Field(..., min_length=1)
    company_name: str = ""
    email: str = ""
    linkedin: str = ""
    notes: str = ""
    relationship_strength: str = "Warm"


class RecruiterUpdate(BaseModel):
    name: str | None = None
    company_name: str | None = None
    email: str | None = None
    linkedin: str | None = None
    notes: str | None = None
    relationship_strength: str | None = None


class RecruiterOut(BaseModel):
    id: str
    name: str
    company_name: str
    email: str
    linkedin: str
    notes: str
    relationship_strength: str
    last_contacted_at: datetime | None = None
    created_at: datetime
