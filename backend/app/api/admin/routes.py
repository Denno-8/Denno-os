"""
Admin API routes — all protected by require_admin dependency.
Only users with role='admin' encoded in their JWT can access these endpoints.
"""
import logging
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin, get_database
from app.services.admin_service import AdminService

logger = logging.getLogger("denno.admin")
router = APIRouter(prefix="/admin", tags=["Admin"])


def get_service(db: AsyncSession = Depends(get_database)) -> AdminService:
    return AdminService(db)


# ─── Platform Analytics & Export ─────────────────────────────────────────────

@router.get("/analytics")
async def platform_analytics(
    _admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """Platform-wide metrics: total users, applications, jobs, companies, offers, avg match score."""
    return await service.platform_analytics()


@router.get("/export")
async def export_data(
    resource: str = Query(..., description="users | jobs | companies"),
    format: str = Query("excel", description="excel | pdf | word"),
    _admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """Export admin data tables as downloadable Excel, PDF, or Word documents."""
    file_bytes, media_type, filename = await service.export_data(resource, format)
    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ─── Users Management ─────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    q: str = Query(default=""),
    role: str = Query(default=""),
    active_status: str = Query(default=""),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    paginated: bool = Query(default=True, description="Return paginated response with total count"),
    admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """List all registered users with per-user application counts, filters, and pagination."""
    if paginated:
        return await service.list_users_paginated(skip, limit, q, role, active_status)
    return await service.list_users(skip, limit, q, role, active_status)


@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    _admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """Get full details for a single user."""
    return await service.get_user(user_id)


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[Literal["user", "admin"]] = None
    is_active: Optional[bool] = None
    years_experience: Optional[int] = None


@router.patch("/users/{user_id}")
async def update_user_profile(
    user_id: int,
    payload: UserProfileUpdate,
    admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """Admin: edit any user's profile fields (name, email, title, role, status, etc.)."""
    data = payload.model_dump(exclude_unset=True)
    # Self-protection: admin cannot demote or deactivate themselves via this endpoint
    if admin_id == user_id:
        if data.get("role") == "user":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot demote your own admin account.")
        if data.get("is_active") is False:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot deactivate your own admin account.")
    logger.info("ADMIN AUDIT | Admin id=%s edited profile of user_id=%s | fields=%s", admin_id, user_id, list(data.keys()))
    return await service.update_user_profile(user_id, data)


class RoleUpdate(BaseModel):
    role: Literal["user", "admin"]  # Validated — rejects any other string


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    payload: RoleUpdate,
    admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """Promote or demote a user's role."""
    logger.info("ADMIN AUDIT | Admin id=%s updated role of user_id=%s to '%s'", admin_id, user_id, payload.role)
    return await service.update_user_role(user_id, payload.role, admin_id=admin_id)


class SuspendUpdate(BaseModel):
    suspended: bool


@router.patch("/users/{user_id}/suspend")
async def suspend_user(
    user_id: int,
    payload: SuspendUpdate,
    admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """Suspend or reactivate a user account."""
    logger.info("ADMIN AUDIT | Admin id=%s set suspended=%s for user_id=%s", admin_id, payload.suspended, user_id)
    return await service.suspend_user(user_id, payload.suspended, admin_id=admin_id)


class PasswordResetRequest(BaseModel):
    new_password: str


@router.post("/users/{user_id}/reset-password")
async def admin_reset_user_password(
    user_id: int,
    payload: PasswordResetRequest,
    admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """Admin: force-reset a user's password."""
    logger.warning("ADMIN AUDIT | Admin id=%s force-reset password of user_id=%s", admin_id, user_id)
    return await service.reset_user_password(user_id, payload.new_password)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """Hard delete a user and all their data (cascade)."""
    logger.warning("ADMIN AUDIT | Admin id=%s DELETED user_id=%s", admin_id, user_id)
    await service.delete_user(user_id, admin_id=admin_id)


class PromoteRequest(BaseModel):
    email: str


@router.post("/promote")
async def promote_user_by_email(
    payload: PromoteRequest,
    admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """Promote a user to admin role by email address."""
    logger.info("ADMIN AUDIT | Admin id=%s promoted user with email '%s' to admin", admin_id, payload.email)
    return await service.promote_by_email(payload.email)


# ─── Jobs Management ──────────────────────────────────────────────────────────

@router.get("/jobs")
async def list_all_jobs(
    mode: str = Query(default=""),
    level: str = Query(default=""),
    is_expired: str = Query(default=""),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    _admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """List all job posts across the platform with mode/level/expired filters."""
    return await service.list_all_jobs(skip, limit, mode, level, is_expired)


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    _admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    await service.delete_job(job_id)


# ─── Companies Management ─────────────────────────────────────────────────────

@router.get("/companies")
async def list_all_companies(
    tier: str = Query(default=""),
    sector: str = Query(default=""),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    _admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """List all companies across the platform with tier/sector filters."""
    return await service.list_all_companies(skip, limit, tier, sector)


@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: int,
    _admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    await service.delete_company(company_id)


# ─── System Email & SMTP Configuration ────────────────────────────────────────

class AdminEmailSettingsUpdate(BaseModel):
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_from_name: str | None = None
    emails_enabled: bool | None = None


class SmtpTestRequest(BaseModel):
    target_email: str | None = None


@router.get("/settings/email")
async def get_admin_email_settings(
    _admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """Retrieve system outbound email / SMTP configuration settings."""
    return await service.get_email_settings()


@router.patch("/settings/email")
async def update_admin_email_settings(
    payload: AdminEmailSettingsUpdate,
    _admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """Update system outbound email / SMTP profile settings."""
    return await service.update_email_settings(payload.model_dump(exclude_unset=True))


@router.post("/settings/email/test")
async def test_smtp_connection(
    payload: SmtpTestRequest,
    _admin_id: int = Depends(require_admin),
    service: AdminService = Depends(get_service),
):
    """Test SMTP connection and send diagnostic ping email."""
    return await service.test_smtp_connection(payload.target_email)
