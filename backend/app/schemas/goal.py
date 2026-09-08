from datetime import date, datetime
from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    label: str = Field(..., min_length=1)
    category: str = "Applications"
    current: int = Field(default=0, ge=0)
    target: int = Field(default=1, ge=1)
    deadline: date | None = None


class GoalUpdate(BaseModel):
    label: str | None = None
    category: str | None = None
    current: int | None = Field(default=None, ge=0)
    target: int | None = Field(default=None, ge=1)
    deadline: date | None = None


class GoalOut(BaseModel):
    id: str
    label: str
    category: str
    current: int
    target: int
    deadline: date | None = None
    created_at: datetime
