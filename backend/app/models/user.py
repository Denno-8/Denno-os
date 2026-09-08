from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.common import PyObjectId


class EducationEntry(BaseModel):
    degree: str = ""
    school: str = ""
    year: str = ""
    grade: str = ""


class ExperienceEntry(BaseModel):
    title: str = ""
    company: str = ""
    period: str = ""
    duties: str = ""


class ProjectEntry(BaseModel):
    name: str = ""
    tech: str = ""
    description: str = ""
    url: str = ""


class NotificationPrefs(BaseModel):
    jobs: bool = True
    deadlines: bool = True
    interviews: bool = True
    emails: bool = True
    learning: bool = True
    weekly_report: bool = True


class UserModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    email: EmailStr
    password_hash: str

    first_name: str = ""
    last_name: str = ""
    phone: str = ""
    location: str = ""
    title: str = ""
    years_experience: int = 0
    linkedin: str = ""
    github: str = ""
    website: str = ""
    summary: str = ""
    career_goal: str = ""
    availability: str = "Immediately"
    notice_period: str = "1 month"
    salary_min: int = 0
    salary_max: int = 0
    currency: str = "KES"
    open_to: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)

    education: list[EducationEntry] = Field(default_factory=list)
    experience_list: list[ExperienceEntry] = Field(default_factory=list)
    projects: list[ProjectEntry] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)

    notifications: NotificationPrefs = Field(default_factory=NotificationPrefs)
    theme: str = "light"
    two_fa_enabled: bool = False
    profile_public: bool = False
    role: str = "user"  # user | admin — baked into the access token at login/register

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
