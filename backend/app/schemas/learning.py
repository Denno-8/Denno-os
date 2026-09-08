from pydantic import BaseModel, Field


class CourseCreate(BaseModel):
    title: str = Field(..., min_length=1)
    category: str
    level: str = "Beginner"
    duration_minutes: int = 0
    lesson_count: int = 1
    url: str = ""
    linked_skill: str = ""


class CourseUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    level: str | None = None
    duration_minutes: int | None = None
    lesson_count: int | None = None
    url: str | None = None
    linked_skill: str | None = None


class ProgressUpdate(BaseModel):
    lessons_completed: int = Field(..., ge=0)


class CourseWithProgressOut(BaseModel):
    id: str
    title: str
    category: str
    level: str
    duration_minutes: int
    lesson_count: int
    url: str
    linked_skill: str
    lessons_completed: int
    status: str
