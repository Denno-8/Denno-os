from datetime import datetime
from pydantic import BaseModel, Field


class QuestionReflection(BaseModel):
    question: str
    answer_given: str = ""
    quality_rating: int = Field(default=3, ge=1, le=5)


class InterviewCreate(BaseModel):
    application_id: str
    type: str = "Technical"
    scheduled_at: datetime
    location: str = ""
    behavioral_questions: list[str] = Field(default_factory=list)
    technical_questions: list[str] = Field(default_factory=list)


class PostMortemCreate(BaseModel):
    questions_asked: list[QuestionReflection] = Field(default_factory=list)
    what_went_well: str = ""
    what_to_improve: str = ""
    overall_confidence: int = Field(default=7, ge=1, le=10)
    follow_up_actions: list[str] = Field(default_factory=list)
    post_interview_notes: str = ""
    outcome: str | None = None  # Passed | Rejected | Pending


class InterviewUpdate(BaseModel):
    status: str | None = None
    location: str | None = None
    prep_checklist: dict[str, bool] | None = None
    post_interview_notes: str | None = None
    outcome: str | None = None
    questions_asked: list[dict] | None = None
    what_went_well: str | None = None
    what_to_improve: str | None = None
    overall_confidence: int | None = None
    follow_up_actions: list[str] | None = None
    post_mortem_done: bool | None = None


class InterviewOut(BaseModel):
    id: str
    application_id: str
    type: str
    scheduled_at: datetime
    location: str
    status: str
    prep_checklist: dict[str, bool]
    behavioral_questions: list[str]
    technical_questions: list[str]
    post_interview_notes: str
    outcome: str | None = None
    questions_asked: list[dict] = Field(default_factory=list)
    what_went_well: str = ""
    what_to_improve: str = ""
    overall_confidence: int | None = None
    follow_up_actions: list[str] = Field(default_factory=list)
    post_mortem_done: bool = False
    has_conflict: bool = False
    conflict_warning: str | None = None
    created_at: datetime
