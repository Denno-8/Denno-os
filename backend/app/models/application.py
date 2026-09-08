"""
Mongo document shape for the `applications` collection.
This mirrors what's stored in the DB — request/response shaping for the
API lives in app/schemas/application.py instead.
"""
from datetime import date, datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.common import PyObjectId


class ApplicationStage(str, Enum):
    SAVED = "Saved"
    PREPARING = "Preparing"
    CV_OPTIMIZED = "CV Optimized"
    APPLIED = "Applied"
    CONFIRMED = "Confirmed"
    UNDER_REVIEW = "Under Review"
    UNRESPONDED = "Unresponded"
    ASSESSMENT = "Assessment"
    TECHNICAL = "Technical"
    HR_INTERVIEW = "HR Interview"
    FINAL_INTERVIEW = "Final Interview"
    OFFER = "Offer"
    ACCEPTED = "Accepted"
    JOB_CLOSED = "Job Closed"
    REJECTED = "Rejected"


class ApplicationModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId

    company_id: Optional[PyObjectId] = None
    company_name: str
    role: str

    stage: ApplicationStage = ApplicationStage.SAVED
    date_applied: date

    cv_version_id: Optional[PyObjectId] = None
    cover_letter_id: Optional[PyObjectId] = None

    required_skills: list[str] = Field(default_factory=list)
    match_score: int = Field(default=0, ge=0, le=100)
    ats_score: int = Field(default=0, ge=0, le=100)

    salary_range: Optional[str] = None
    notes: Optional[str] = None
    checklist: dict[str, bool] = Field(default_factory=dict)

    source_job_id: Optional[PyObjectId] = None
    source_url: Optional[str] = None
    recruiter_email: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
