from datetime import datetime
from pydantic import BaseModel, Field


class CVVersionCreate(BaseModel):
    name: str = Field(..., min_length=1)
    focus: str = ""
    ats_score: int = Field(default=0, ge=0, le=100)
    skills: list[str] = Field(default_factory=list)
    file_url: str | None = None
    parsed_content: str | None = None


class CVVersionUpdate(BaseModel):
    name: str | None = None
    focus: str | None = None
    ats_score: int | None = Field(default=None, ge=0, le=100)
    skills: list[str] | None = None
    file_url: str | None = None
    parsed_content: str | None = None


class CVVersionOut(BaseModel):
    id: str
    name: str
    focus: str
    ats_score: int
    skills: list[str]
    file_url: str | None = None
    parsed_content: str | None = None
    parsed_sections: dict | None = None
    times_used: int
    last_used_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class CVAnalysisOut(BaseModel):
    cv_id: str
    ats_score: int
    readability_rating: str
    matched_skills_count: int
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    red_flags: list[str] = Field(default_factory=list)
    quantified_metrics_count: int = 0
    keyword_suggestions: list[str] = Field(default_factory=list)
    optimization_tips: list[str] = Field(default_factory=list)


class CVTailorRequest(BaseModel):
    job_title: str
    required_skills: list[str] = Field(default_factory=list)
    description: str = ""


class CVTailorOut(BaseModel):
    cv_id: str
    base_cv: dict
    tailored_cv: dict
    diff: dict


class CVGenerateForJobRequest(BaseModel):
    job_title: str
    company_name: str
    required_skills: list[str] = Field(default_factory=list)
    description: str = ""

