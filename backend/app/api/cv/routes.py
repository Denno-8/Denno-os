from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user_id, get_database
from app.core.limiter import limiter
from app.core.sanitize import sanitize_filename, validate_cv_file_bytes
from app.schemas.cv_version import (
    CVVersionCreate, CVVersionUpdate, CVVersionOut, CVAnalysisOut,
    CVTailorRequest, CVTailorOut, CVGenerateForJobRequest
)
from app.services.cv_version_service import CVVersionService

router = APIRouter(prefix="/cv", tags=["CV Manager"])


def get_service(db: AsyncSession = Depends(get_database)) -> CVVersionService:
    return CVVersionService(db)


@router.get("", response_model=list[CVVersionOut])
async def list_cv_versions(
    user_id: int = Depends(get_current_user_id),
    service: CVVersionService = Depends(get_service),
):
    return await service.list(user_id)


@router.post("", response_model=CVVersionOut, status_code=status.HTTP_201_CREATED)
async def create_cv_version(
    payload: CVVersionCreate,
    user_id: int = Depends(get_current_user_id),
    service: CVVersionService = Depends(get_service),
):
    return await service.create(user_id, payload)


@router.post("/generate-for-job", response_model=CVVersionOut, status_code=status.HTTP_201_CREATED)
async def generate_cv_for_job(
    payload: CVGenerateForJobRequest,
    user_id: int = Depends(get_current_user_id),
    service: CVVersionService = Depends(get_service),
):
    """Auto-generate a 98% ATS-compliant tailored CV version for a specific job post and save to candidate library."""
    return await service.generate_for_job(
        user_id=user_id,
        job_title=payload.job_title,
        company_name=payload.company_name,
        required_skills=payload.required_skills,
        description=payload.description
    )


@router.get("/diff")
async def diff_cv_versions(
    v1: int = Query(...),
    v2: int = Query(...),
    user_id: int = Depends(get_current_user_id),
    service: CVVersionService = Depends(get_service),
):
    """Compare two CV versions side-by-side."""
    return await service.diff_versions(v1, v2, user_id)


@router.get("/{cv_id}", response_model=CVVersionOut)
async def get_cv_version(
    cv_id: int,
    user_id: int = Depends(get_current_user_id),
    service: CVVersionService = Depends(get_service),
):
    """Get single CV version details."""
    doc = await service.get(cv_id, user_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "CV version not found")
    return doc


@router.get("/{cv_id}/download")
async def download_cv_raw_file(
    cv_id: int,
    user_id: int = Depends(get_current_user_id),
    service: CVVersionService = Depends(get_service),
):
    """Download the original uploaded CV file (PDF, DOCX, or TXT)."""
    file_bytes, media_type, filename = await service.get_raw_file(cv_id, user_id)
    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.patch("/{cv_id}", response_model=CVVersionOut)
async def update_cv_version(
    cv_id: int,
    payload: CVVersionUpdate,
    user_id: int = Depends(get_current_user_id),
    service: CVVersionService = Depends(get_service),
):
    doc = await service.update(cv_id, user_id, payload)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "CV version not found")
    return doc


@router.post("/{cv_id}/upload", response_model=CVVersionOut)
@limiter.limit("20/minute")
async def upload_cv_file(
    cv_id: int,
    request: Request,
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    service: CVVersionService = Depends(get_service),
):
    """Upload PDF or DOCX file to extract text, parse sections, and populate skills."""
    _ALLOWED_MIME = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    }
    if file.content_type not in _ALLOWED_MIME:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"Unsupported file type '{file.content_type}'. Only PDF, DOCX, and plain text are accepted.",
        )

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    file_bytes = await file.read()
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File exceeds the {settings.max_upload_size_mb} MB upload limit.",
        )

    # Magic-byte validation: verify file content matches its declared MIME type.
    try:
        validate_cv_file_bytes(file_bytes, file.content_type)
    except ValueError as exc:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, str(exc))

    # Sanitize filename to prevent path traversal and illegal characters.
    safe_name = sanitize_filename(file.filename)

    return await service.upload_file(cv_id, user_id, safe_name, file_bytes)


@router.post("/{cv_id}/tailor", response_model=CVTailorOut)
async def tailor_cv(
    cv_id: int,
    payload: CVTailorRequest,
    user_id: int = Depends(get_current_user_id),
    service: CVVersionService = Depends(get_service),
):
    """Generate tailored CV content for a specific target job."""
    return await service.tailor_cv(
        cv_id, user_id, payload.job_title, payload.required_skills, payload.description
    )


@router.post("/{cv_id}/record-usage", response_model=CVVersionOut)
async def record_usage(
    cv_id: int,
    user_id: int = Depends(get_current_user_id),
    service: CVVersionService = Depends(get_service),
):
    doc = await service.record_usage(cv_id, user_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "CV version not found")
    return doc


@router.post("/{cv_id}/analyze", response_model=CVAnalysisOut)
async def analyze_cv(
    cv_id: int,
    user_id: int = Depends(get_current_user_id),
    service: CVVersionService = Depends(get_service),
):
    result = await service.analyze_cv(cv_id, user_id)
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "CV version not found")
    return result


@router.get("/{cv_id}/export.pdf")
async def export_cv_pdf(
    cv_id: int,
    theme: str = Query("Sapphire"),
    user_id: int = Depends(get_current_user_id),
    service: CVVersionService = Depends(get_service),
):
    """Export formatted PDF for CV version with selected accent color theme."""
    pdf_bytes = await service.export_pdf(cv_id, user_id, theme_name=theme)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cv_{cv_id}.pdf"}
    )


@router.delete("/{cv_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cv_version(
    cv_id: int,
    user_id: int = Depends(get_current_user_id),
    service: CVVersionService = Depends(get_service),
):
    deleted = await service.delete(cv_id, user_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "CV version not found")
