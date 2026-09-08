from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_database
from app.schemas.interview import InterviewCreate, InterviewUpdate, InterviewOut, PostMortemCreate
from app.services.interview_service import InterviewService

router = APIRouter(prefix="/interviews", tags=["Interviews"])


def get_service(db: AsyncSession = Depends(get_database)) -> InterviewService:
    return InterviewService(db)


@router.get("", response_model=list[InterviewOut])
async def list_interviews(
    upcoming_only: bool = Query(default=False),
    user_id: int = Depends(get_current_user_id),
    service: InterviewService = Depends(get_service),
):
    return await service.list(user_id, upcoming_only)


@router.post("", response_model=InterviewOut, status_code=status.HTTP_201_CREATED)
async def create_interview(
    payload: InterviewCreate,
    user_id: int = Depends(get_current_user_id),
    service: InterviewService = Depends(get_service),
):
    return await service.create(user_id, payload)


@router.post("/{interview_id}/post-mortem", response_model=InterviewOut)
async def save_post_mortem(
    interview_id: int,
    payload: PostMortemCreate,
    user_id: int = Depends(get_current_user_id),
    service: InterviewService = Depends(get_service),
):
    """Structured post-mortem reflection form submission — auto-feeds into Knowledge Base."""
    return await service.save_post_mortem(interview_id, user_id, payload)


@router.patch("/{interview_id}", response_model=InterviewOut)
async def update_interview(
    interview_id: int,
    payload: InterviewUpdate,
    user_id: int = Depends(get_current_user_id),
    service: InterviewService = Depends(get_service),
):
    doc = await service.update(interview_id, user_id, payload)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")
    return doc


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: int,
    user_id: int = Depends(get_current_user_id),
    service: InterviewService = Depends(get_service),
):
    deleted = await service.delete(interview_id, user_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")


from pydantic import BaseModel


class MockQuestionsPayload(BaseModel):
    role_title: str = "Software Engineer"
    company_name: str = "Target Company"
    interview_type: str = "Technical"


class EvaluateStarPayload(BaseModel):
    question: str
    response_text: str


@router.post("/mock-questions")
async def get_mock_questions(
    payload: MockQuestionsPayload,
    service: InterviewService = Depends(get_service),
):
    """Generates tailored mock interview questions for practice."""
    return await service.generate_mock_questions(payload.role_title, payload.company_name, payload.interview_type)


@router.post("/evaluate-star")
async def evaluate_star(
    payload: EvaluateStarPayload,
    service: InterviewService = Depends(get_service),
):
    """Evaluates candidate response using the STAR framework."""
    return await service.evaluate_star_response(payload.question, payload.response_text)
