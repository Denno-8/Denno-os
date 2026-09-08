from datetime import date, datetime
from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    company_id: str
    company_name: str
    title: str
    mode: str = "Remote"
    level: str = "Mid"
    employment_type: str = "Full-time"
    salary_min: int = 0
    salary_max: int = 0
    currency: str = "KES"
    required_skills: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    match_score: int = Field(default=75, ge=0, le=100)
    ats_score: int = Field(default=70, ge=0, le=100)
    deadline: date | None = None
    is_expired: bool = False
    source_url: str = ""
    contact_email: str = ""
    is_hot: bool = False
    description: str = ""


class JobUpdate(BaseModel):
    title: str | None = None
    mode: str | None = None
    level: str | None = None
    employment_type: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    required_skills: list[str] | None = None
    requirements: list[str] | None = None
    match_score: int | None = Field(default=None, ge=0, le=100)
    ats_score: int | None = Field(default=None, ge=0, le=100)
    deadline: date | None = None
    is_expired: bool | None = None
    source_url: str | None = None
    contact_email: str | None = None
    is_hot: bool | None = None
    description: str | None = None


class JobOut(BaseModel):
    id: str
    company_id: str
    company_name: str
    title: str
    mode: str
    level: str
    employment_type: str
    salary_min: int
    salary_max: int
    currency: str
    required_skills: list[str]
    requirements: list[str] = Field(default_factory=list)
    match_score: int
    ats_score: int
    posted_at: datetime
    deadline: date | None = None
    is_expired: bool = False
    source_url: str
    contact_email: str
    is_hot: bool
    description: str
