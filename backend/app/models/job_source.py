from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.common import PyObjectId


class JobSourceModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    company_id: PyObjectId
    company_name: str  # denormalized for the Source Monitor list view

    url: str
    scrape_method: str = "manual"  # manual | api | html_scrape | ats_integration
    status: str = "recent"  # verified | recent | expired | archived
    jobs_found: int = 0
    last_checked_at: datetime = Field(default_factory=datetime.utcnow)

    created_at: datetime = Field(default_factory=datetime.utcnow)
