from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_database
from app.schemas.email import EmailCreate, EmailUpdate, EmailOut
from app.services.email_service import EmailService

router = APIRouter(prefix="/emails", tags=["Emails"])


def get_service(db: AsyncSession = Depends(get_database)) -> EmailService:
    return EmailService(db)


@router.get("", response_model=list[EmailOut])
async def list_emails(
    unread_only: bool = Query(default=False),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    user_id: str = Depends(get_current_user_id),
    service: EmailService = Depends(get_service),
):
    return await service.list(user_id, unread_only, skip, limit)


@router.get("/unread-count", response_model=int)
async def unread_count(
    user_id: str = Depends(get_current_user_id),
    service: EmailService = Depends(get_service),
):
    return await service.unread_count(user_id)


@router.post("", response_model=EmailOut, status_code=status.HTTP_201_CREATED)
async def create_email(
    payload: EmailCreate,
    user_id: str = Depends(get_current_user_id),
    service: EmailService = Depends(get_service),
):
    return await service.create(user_id, payload)


@router.patch("/{email_id}", response_model=EmailOut)
async def update_email(
    email_id: int,
    payload: EmailUpdate,
    user_id: str = Depends(get_current_user_id),
    service: EmailService = Depends(get_service),
):
    doc = await service.update(email_id, user_id, payload)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Email not found")
    return doc


@router.delete("/{email_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_email(
    email_id: int,
    user_id: str = Depends(get_current_user_id),
    service: EmailService = Depends(get_service),
):
    deleted = await service.delete(email_id, user_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Email not found")


class ClassifyEmailPayload(BaseModel):
    subject: str
    body: str
    sender: Optional[str] = ""


@router.post("/sync-inbox")
async def sync_inbox(
    user_id: str = Depends(get_current_user_id),
    service: EmailService = Depends(get_service),
):
    """Syncs/parses incoming recruiter emails and auto-updates matching active Applications."""
    try:
        uid = int(user_id)
    except Exception:
        uid = 1
    return await service.sync_inbound_responses(uid)


@router.post("/classify")
async def classify_email_text(
    payload: ClassifyEmailPayload,
    user_id: str = Depends(get_current_user_id),
):
    """AI Email Intent Classifier for recruiter emails."""
    from app.services.email_classifier_service import EmailClassifierService
    return EmailClassifierService.classify_email(payload.subject, payload.body, payload.sender or "")


@router.get("/oauth/google/url")
async def get_google_oauth_url(user_id: str = Depends(get_current_user_id)):
    """Returns OAuth2 consent redirect URL for Google Workspace / Gmail."""
    from app.core.config import settings
    client_id = getattr(settings, "GOOGLE_CLIENT_ID", "google-oauth-client-id.apps.googleusercontent.com")
    redirect_uri = "http://localhost:5173/applications?oauth=google_success"
    scope = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send"
    url = f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}&access_type=offline&prompt=consent"
    return {"provider": "google", "oauth_url": url, "configured": bool(client_id and "apps.googleusercontent.com" not in client_id)}


@router.get("/oauth/microsoft/url")
async def get_microsoft_oauth_url(user_id: str = Depends(get_current_user_id)):
    """Returns OAuth2 consent redirect URL for Microsoft 365 / Outlook Graph API."""
    from app.core.config import settings
    client_id = getattr(settings, "MICROSOFT_CLIENT_ID", "microsoft-oauth-client-id")
    redirect_uri = "http://localhost:5173/applications?oauth=microsoft_success"
    scope = "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send"
    url = f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id={client_id}&response_type=code&redirect_uri={redirect_uri}&response_mode=query&scope={scope}"
    return {"provider": "microsoft", "oauth_url": url, "configured": bool(client_id and "microsoft-oauth-client-id" not in client_id)}


