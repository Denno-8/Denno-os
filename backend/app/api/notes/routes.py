from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_database
from app.schemas.note import NoteCreate, NoteUpdate, NoteOut
from app.services.note_service import NoteService

router = APIRouter(prefix="/notes", tags=["Knowledge Base"])


def get_service(db: AsyncSession = Depends(get_database)) -> NoteService:
    return NoteService(db)


@router.get("", response_model=list[NoteOut])
async def list_notes(
    category: str | None = Query(default=None),
    q: str | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
    service: NoteService = Depends(get_service),
):
    return await service.list(user_id, category, q)


@router.get("/categories", response_model=list[str])
async def list_categories(
    user_id: str = Depends(get_current_user_id),
    service: NoteService = Depends(get_service),
):
    return await service.categories(user_id)


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
async def create_note(
    payload: NoteCreate,
    user_id: str = Depends(get_current_user_id),
    service: NoteService = Depends(get_service),
):
    return await service.create(user_id, payload)


@router.patch("/{note_id}", response_model=NoteOut)
async def update_note(
    note_id: int,
    payload: NoteUpdate,
    user_id: str = Depends(get_current_user_id),
    service: NoteService = Depends(get_service),
):
    doc = await service.update(note_id, user_id, payload)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Note not found")
    return doc


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: int,
    user_id: str = Depends(get_current_user_id),
    service: NoteService = Depends(get_service),
):
    deleted = await service.delete(note_id, user_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Note not found")

