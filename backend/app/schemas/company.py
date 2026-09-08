from datetime import datetime
from pydantic import BaseModel, Field


class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=1)
    sector: str
    location: str
    ats_platform: str = "Internal"
    career_url: str = ""
    contact_email: str = ""
    tech_stack: list[str] = Field(default_factory=list)
    open_roles_count: int = 0
    tier: int = 1


class CompanyUpdate(BaseModel):
    name: str | None = None
    sector: str | None = None
    location: str | None = None
    ats_platform: str | None = None
    career_url: str | None = None
    contact_email: str | None = None
    tech_stack: list[str] | None = None
    open_roles_count: int | None = None
    tier: int | None = None


class CompanyOut(BaseModel):
    id: str
    name: str
    sector: str
    location: str
    ats_platform: str
    career_url: str
    contact_email: str
    tech_stack: list[str]
    open_roles_count: int
    tier: int
    verification_status: str
    created_at: datetime
