from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.common import PyObjectId


class InterviewModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    application_id: PyObjectId

    type: str = "Technical"  # Technical | HR | Final | Assessment
    scheduled_at: datetime
    location: str = ""
    status: str = "scheduled"  # scheduled | completed | cancelled

    prep_checklist: dict[str, bool] = Field(default_factory=dict)
    behavioral_questions: list[str] = Field(default_factory=list)
    technical_questions: list[str] = Field(default_factory=list)
    post_interview_notes: str = ""
    outcome: Optional[str] = None  # pending | passed | failed | None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
