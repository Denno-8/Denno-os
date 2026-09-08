from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.common import PyObjectId


class VerificationInfo(BaseModel):
    status: str = "recent"  # verified | recent | expired | archived
    last_checked_at: datetime = Field(default_factory=datetime.utcnow)


class CompanyModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    sector: str
    location: str
    ats_platform: str = "Internal"
    career_url: str = ""
    contact_email: str = ""
    tech_stack: list[str] = Field(default_factory=list)
    open_roles_count: int = 0
    tier: int = 1
    verification: VerificationInfo = Field(default_factory=VerificationInfo)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
