from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.common import PyObjectId


class CVVersionModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId

    name: str
    focus: str = ""
    ats_score: int = Field(default=0, ge=0, le=100)
    skills: list[str] = Field(default_factory=list)
    file_url: Optional[str] = None
    times_used: int = 0
    last_used_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
