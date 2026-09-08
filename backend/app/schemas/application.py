"""
Pydantic schemas exposed over the HTTP API. Kept separate from the Mongo
model so we can evolve wire format and storage format independently.
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.application import ApplicationStage


class ApplicationCreate(BaseModel):
    company_name: str = Field(..., min_length=1, examples=["Safaricom"])
    role: str = Field(..., min_length=1, examples=["Backend Developer"])
    stage: ApplicationStage = ApplicationStage.APPLIED
    date_applied: date
    company_id: Optional[str] = None
    cv_version_id: Optional[str] = None
    required_skills: list[str] = Field(default_factory=list)
    match_score: int = Field(default=0, ge=0, le=100)
    ats_score: int = Field(default=0, ge=0, le=100)
    salary_range: Optional[str] = None
    notes: Optional[str] = None
    source_job_id: Optional[str] = None
    source_url: Optional[str] = None
    recruiter_email: Optional[str] = None
    apply_method: Optional[str] = "website"
    app_letter_text: Optional[str] = None


class ApplicationUpdate(BaseModel):
    """All fields optional — PATCH semantics."""
    company_name: Optional[str] = None
    role: Optional[str] = None
    stage: Optional[ApplicationStage] = None
    date_applied: Optional[date] = None
    cv_version_id: Optional[str] = None
    required_skills: Optional[list[str]] = None
    match_score: Optional[int] = Field(default=None, ge=0, le=100)
    ats_score: Optional[int] = Field(default=None, ge=0, le=100)
    salary_range: Optional[str] = None
    notes: Optional[str] = None
    checklist: Optional[dict[str, bool]] = None
    source_job_id: Optional[str] = None
    source_url: Optional[str] = None
    recruiter_email: Optional[str] = None
    apply_method: Optional[str] = None
    app_letter_text: Optional[str] = None


class ApplicationOut(BaseModel):
    id: str
    company_name: str
    role: str
    stage: ApplicationStage
    date_applied: date
    required_skills: list[str] = Field(default_factory=list)
    match_score: int
    ats_score: int
    salary_range: Optional[str] = None
    notes: Optional[str] = None
    recruiter_email: Optional[str] = None
    source_job_id: Optional[str] = None
    source_url: Optional[str] = None
    apply_method: Optional[str] = "website"
    cv_version_id: Optional[str] = None
    cv_snapshot: Optional[dict] = None
    app_letter_snapshot: Optional[dict] = None
    email_sent: Optional[bool] = None
    smtp_error: Optional[str] = None
    checklist: dict[str, bool] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class ApplicationAnalytics(BaseModel):
    total: int
    interviews: int
    offers: int
    responded: int
    not_responded: int
    feedback_received: int
    response_rate: int
    interview_rate: int
    offer_rate: int
    avg_match: int
    avg_ats: int
    by_stage: dict[str, int]

