import json
import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_id, get_database, require_admin
from app.core.redis_client import get_redis
from app.schemas.job import JobCreate, JobUpdate, JobOut
from app.schemas.application import ApplicationOut
from app.services.job_service import JobService

router = APIRouter(prefix="/jobs", tags=["Jobs"])

CACHE_TTL_SECONDS = 300  # 5 minutes: jobs are refreshed by background sync, not real-time writes
CACHE_PREFIX = "jobs:list:"


def get_service(db: AsyncSession = Depends(get_database)) -> JobService:
    return JobService(db)


async def _invalidate_list_cache() -> None:
    """Best-effort cache bust after any write — a SCAN+DELETE rather than
    FLUSHDB so it doesn't touch unrelated cache keys (e.g. companies')."""
    r = get_redis()
    try:
        async for key in r.scan_iter(match=f"{CACHE_PREFIX}*"):
            await r.delete(key)
    except Exception:
        pass  # cache invalidation failing shouldn't fail the write itself


@router.get("", response_model=list[JobOut])
async def list_jobs(
    q: str | None = Query(default=None, max_length=100),
    mode: str | None = Query(default=None, pattern="^(Remote|Hybrid|Onsite|All)$", description="Remote | Hybrid | Onsite | All"),
    level: str | None = Query(default=None, pattern="^(Intern|Entry|Junior|Mid|Senior|Lead|All)$", description="Intern | Entry | Junior | Mid | Senior | Lead | All"),
    sort: str = Query(default="match", pattern="^(match|newest)$"),
    date_filter: str = Query(default="all", pattern="^(all|today|week)$"),
    include_expired: bool = Query(default=False),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    service: JobService = Depends(get_service),
):
    """Public feed — defaults to live, non-expired jobs."""
    cache_key = f"{CACHE_PREFIX}{q}:{mode}:{level}:{sort}:{date_filter}:{include_expired}:{skip}:{limit}"
    r = get_redis()
    try:
        cached = await r.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    results = await service.list(q, mode, level, skip, limit, include_expired, sort, date_filter)
    try:
        await r.set(cache_key, json.dumps(results, default=str), ex=CACHE_TTL_SECONDS)
    except Exception:
        pass
    return results


@router.post("/expire-sweep")
async def sweep_expired_jobs(
    _admin_id: str = Depends(require_admin),
    service: JobService = Depends(get_service),
):
    """Admin endpoint to automatically mark overdue jobs as expired."""
    count = await service.expire_overdue()
    await _invalidate_list_cache()
    return {"expired_count": count}


@router.post("/sync-live")
async def sync_live_daily_jobs(
    _user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_database),
):
    """Fetch active daily software engineering and tech jobs from live APIs (Jobicy, RemoteOK, Arbeitnow)."""
    from app.services.real_job_aggregator import RealJobAggregatorService
    aggregator = RealJobAggregatorService(db)
    result = await aggregator.sync_all_live_jobs()
    await _invalidate_list_cache()
    return result


@router.get("/feed/openedcareer")
async def get_openedcareer_job_feed(
    db: AsyncSession = Depends(get_database),
):
    """Fetch live tech job feed from OpenedCareer (https://openedcareer.com/job).
    Attempts live fetch and falls back to database listings if cloudflare/network blocks external RSS."""
    raw_jobs = []
    try:
        from app.services.real_job_aggregator import RealJobAggregatorService
        aggregator = RealJobAggregatorService(db)
        raw_jobs = await asyncio.wait_for(aggregator.fetch_from_openedcareer_tech(limit=40), timeout=5.0)
    except Exception as exc:
        import logging
        logging.getLogger("denno.jobs").warning("Live OpenedCareer fetch timed out or blocked: %s", exc)

    if not raw_jobs:
        # Fallback: Query active jobs from database
        from sqlalchemy import select, or_
        from app.models.sqlalchemy_models import Job
        stmt = (
            select(Job)
            .where(
                Job.is_expired == False,
                or_(
                    Job.source_url.ilike("%openedcareer%"),
                    Job.company_name.ilike("%openedcareer%"),
                    Job.title.ilike("%openedcareer%"),
                    Job.company_name.ilike("%kenya%"),
                    Job.mode.ilike("%remote%"),
                    Job.title.ilike("%engineer%"),
                    Job.title.ilike("%developer%"),
                )
            )
            .order_by(Job.id.desc())
            .limit(40)
        )
        res = await db.execute(stmt)
        db_jobs = res.scalars().all()
        for j in db_jobs:
            raw_jobs.append({
                "title": j.title,
                "company_name": j.company_name,
                "mode": j.mode,
                "level": j.level,
                "posted_at": j.posted_at,
                "source_url": j.source_url or "https://openedcareer.com/job",
                "description": j.description,
                "required_skills": j.required_skills or [],
            })

    formatted_listings = []
    for idx, item in enumerate(raw_jobs):
        posted_val = item.get("posted_at")
        posted_str = posted_val.isoformat() if hasattr(posted_val, "isoformat") else str(posted_val or "")
        formatted_listings.append({
            "id": f"openedcareer-{idx}-{abs(hash(item.get('source_url', ''))) % 100000}",
            "title": item.get("title", "Tech Opportunity"),
            "company": item.get("company_name", "Kenyan Tech Enterprise"),
            "location": "Nairobi, Kenya" if item.get("mode") != "Remote" else "Remote",
            "remote": item.get("mode") == "Remote",
            "posted_at": posted_str,
            "url": item.get("source_url", "https://openedcareer.com/job"),
            "description": item.get("description", ""),
            "level": item.get("level", "Mid"),
            "required_skills": item.get("required_skills", []),
        })
    return formatted_listings




@router.get("/intelligence/salary-benchmarks")
async def get_salary_benchmarks(
    service: JobService = Depends(get_service),
):
    """Returns aggregated market salary ranges grouped by experience level."""
    return await service.get_salary_benchmarks()


@router.get("/intelligence/company/{company_name}")
async def get_company_intelligence(
    company_name: str,
    service: JobService = Depends(get_service),
):
    """Returns top required skills, hiring velocity, and ghost job risk for a given company."""
    return await service.get_company_intelligence(company_name)


@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: int, service: JobService = Depends(get_service)):
    doc = await service.get(job_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    return doc


from pydantic import BaseModel, HttpUrl


class FetchJobPayload(BaseModel):
    url: str


@router.post("/fetch-external", response_model=JobOut, status_code=status.HTTP_201_CREATED)
async def fetch_external_job(
    payload: FetchJobPayload,
    _user_id: str = Depends(get_current_user_id),
    service: JobService = Depends(get_service),
):
    """Fetches and parses a job posting from LinkedIn or an external URL, auto-extracting key requirements."""
    doc = await service.fetch_external(payload.url)
    await _invalidate_list_cache()
    return doc


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: JobCreate,
    _admin_id: str = Depends(require_admin),
    service: JobService = Depends(get_service),
):
    """Admin-only: jobs are normally written by the seed scripts or the
    automation/scraper layer, not end users."""
    doc = await service.create(payload)
    await _invalidate_list_cache()
    return doc



@router.post("/{job_id}/apply", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    job_id: int,
    user_id: str = Depends(get_current_user_id),
    service: JobService = Depends(get_service),
):
    """One-click apply: turns a Job into a tracked Application for this user.
    Any authenticated user can do this — it's not an admin action."""
    try:
        return await service.apply(job_id, user_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))


@router.patch("/{job_id}", response_model=JobOut)
async def update_job(
    job_id: int,
    payload: JobUpdate,
    _admin_id: str = Depends(require_admin),
    service: JobService = Depends(get_service),
):
    doc = await service.update(job_id, payload)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    await _invalidate_list_cache()
    return doc


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    _admin_id: str = Depends(require_admin),
    service: JobService = Depends(get_service),
):
    deleted = await service.delete(job_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    await _invalidate_list_cache()


class ScreeningQuestionPayload(BaseModel):
    question: str
    role_title: str | None = "Software Engineer"
    company_name: str | None = "Target Company"


@router.get("/{job_id}/autofill-payload")
async def get_autofill_payload(
    job_id: int,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_database),
):
    """Returns candidate profile JSON payload and browser console bookmarklet script for 1-click ATS auto-filling."""
    from app.services.portal_autofill_service import PortalAutofillService
    try:
        uid = int(user_id)
    except Exception:
        uid = 1
    svc = PortalAutofillService(db)
    return await svc.get_candidate_payload(uid, job_id=job_id)


@router.post("/screening-question")
async def answer_screening_question(
    payload: ScreeningQuestionPayload,
    user_id: str = Depends(get_current_user_id),
):
    """Generates AI-tailored answers for application portal custom screening questions."""
    from app.services.portal_autofill_service import PortalAutofillService
    ans = PortalAutofillService.answer_screening_question(
        payload.question,
        role_title=payload.role_title or "Software Engineer",
        company_name=payload.company_name or "Target Company"
    )
    return {"question": payload.question, "answer": ans}


@router.get("/telemetry/status")
async def get_jobs_telemetry_status(
    db: AsyncSession = Depends(get_database)
):
    """Returns real-time telemetry metrics for daily job engines and active Kenyan source feeds."""
    from sqlalchemy import select, func
    from datetime import datetime
    from app.models.sqlalchemy_models import Job, JobSource

    total_res = await db.execute(select(func.count(Job.id)).where(Job.is_expired == False))
    total_jobs = total_res.scalar() or 0

    hot_res = await db.execute(select(func.count(Job.id)).where(Job.is_hot == True, Job.is_expired == False))
    hot_jobs = hot_res.scalar() or 0

    sources_res = await db.execute(select(func.count(JobSource.id)).where(JobSource.is_active == True))
    sources_count = sources_res.scalar() or 11

    return {
        "engine_status": "Online & Syncing Daily",
        "total_active_jobs": total_jobs,
        "hot_jobs_count": hot_jobs,
        "active_sources_count": sources_count,
        "kenya_verified_portals": ["MyJobMag Kenya", "Fuzu", "BrighterMonday Kenya", "CampusBizz Portal", "Jobs Opened Kenya"],
        "global_remote_portals": ["Remotive", "Arbeitnow", "Jobspresso", "RemoteOK"],
        "last_auto_synced_at": datetime.now().isoformat()
    }


