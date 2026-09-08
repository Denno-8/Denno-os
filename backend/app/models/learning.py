from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.common import PyObjectId


class CourseModel(BaseModel):
    """Shared catalog entry — not per-user."""
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    title: str
    category: str
    level: str = "Beginner"  # Beginner | Intermediate | Advanced
    duration_minutes: int = 0
    lesson_count: int = 1
    url: str = ""
    linked_skill: str = ""


class UserCourseProgressModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    course_id: PyObjectId
    lessons_completed: int = 0
    status: str = "not_started"  # not_started | in_progress | complete
    updated_at: datetime = Field(default_factory=datetime.utcnow)
