import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_database, require_admin
from app.core.redis_client import get_redis
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyOut
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies", tags=["Companies"])

CACHE_TTL_SECONDS = 300  # companies change far less often than jobs — safe to cache longer
CACHE_PREFIX = "companies:list:"


def get_service(db: AsyncSession = Depends(get_database)) -> CompanyService:
    return CompanyService(db)


async def _invalidate_list_cache() -> None:
    r = get_redis()
    try:
        async for key in r.scan_iter(match=f"{CACHE_PREFIX}*"):
            await r.delete(key)
    except Exception:
        pass


@router.get("", response_model=list[CompanyOut])
async def list_companies(
    q: str | None = Query(default=None, description="Full-text search across name/sector"),
    sector: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    service: CompanyService = Depends(get_service),
):
    """Public directory — no auth required, mirrors the prototype's CompaniesView.
    Cached in Redis; falls back to a live DB read if Redis is unreachable."""
    cache_key = f"{CACHE_PREFIX}{q}:{sector}:{skip}:{limit}"
    r = get_redis()
    try:
        cached = await r.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    results = await service.list(q, sector, skip, limit)
    try:
        await r.set(cache_key, json.dumps(results, default=str), ex=CACHE_TTL_SECONDS)
    except Exception:
        pass
    return results


@router.get("/sectors", response_model=list[str])
async def list_sectors(service: CompanyService = Depends(get_service)):
    return await service.sectors()


@router.get("/{company_id}", response_model=CompanyOut)
async def get_company(company_id: int, service: CompanyService = Depends(get_service)):
    doc = await service.get(company_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Company not found")
    return doc


@router.post("", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
async def create_company(
    payload: CompanyCreate,
    _admin_id: str = Depends(require_admin),
    service: CompanyService = Depends(get_service),
):
    """Admin-only: companies are normally populated by the seed scripts or
    automation/scraper layer, not by end users."""
    doc = await service.create(payload)
    await _invalidate_list_cache()
    return doc


@router.patch("/{company_id}", response_model=CompanyOut)
async def update_company(
    company_id: int,
    payload: CompanyUpdate,
    _admin_id: str = Depends(require_admin),
    service: CompanyService = Depends(get_service),
):
    doc = await service.update(company_id, payload)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Company not found")
    await _invalidate_list_cache()
    return doc


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: int,
    _admin_id: str = Depends(require_admin),
    service: CompanyService = Depends(get_service),
):
    deleted = await service.delete(company_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Company not found")
    await _invalidate_list_cache()
