from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.common import PyObjectId


class JobModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    company_id: PyObjectId
    company_name: str  # denormalized for fast list rendering

    title: str
    mode: str = "Remote"       # Remote | Hybrid | Onsite
    level: str = "Mid"         # Entry | Junior | Mid | Senior | Lead
    employment_type: str = "Full-time"

    salary_min: int = 0
    salary_max: int = 0
    currency: str = "KES"

    required_skills: list[str] = Field(default_factory=list)
    match_score: int = Field(default=75, ge=0, le=100)
    ats_score: int = Field(default=70, ge=0, le=100)

    posted_at: datetime = Field(default_factory=datetime.utcnow)
    deadline: Optional[date] = None
    source_url: str = ""
    contact_email: str = ""
    is_hot: bool = False
    description: str = ""

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
