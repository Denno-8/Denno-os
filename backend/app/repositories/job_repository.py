from __future__ import annotations

from datetime import datetime, date, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, update, func
from app.models.sqlalchemy_models import Job

# Throttle the inline expiry cleanup: at most once every 5 minutes globally.
# This avoids an extra DB UPDATE on every single /jobs list request.
_last_expire_run: datetime | None = None
_EXPIRE_INTERVAL_SECONDS = 300  # 5 minutes


class JobRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: dict) -> Job:
        """Create a new job."""
        job = Job(**data)
        self.session.add(job)
        await self.session.flush()
        return job

    async def get(self, job_id: int) -> Job | None:
        """Fetch job by ID."""
        return await self.session.get(Job, job_id)

    async def list(
        self,
        q: str | None = None,
        mode: str | None = None,
        level: str | None = None,
        include_expired: bool = False,
        skip: int = 0,
        limit: int = 100,
        sort: str = "match",        # "match" | "newest"
        date_filter: str = "all",   # "all" | "today" | "week"
    ) -> list[Job]:
        """List jobs with optional filters, sort, and date range.

        Always excludes jobs that are expired OR whose deadline has already passed,
        unless the caller explicitly sets include_expired=True.
        Auto-expires overdue jobs at most once every 5 minutes (throttled).
        """
        # ── Throttled deadline cleanup — avoids a DB write on every request ───
        await self._throttled_expire()

        query = select(Job)

        if not include_expired:
            today = date.today()
            # Exclude if flagged expired OR if deadline has already passed
            query = query.where(Job.is_expired.is_(False)).where(
                or_(Job.deadline.is_(None), Job.deadline >= today)
            )

        if mode and mode != "All":
            query = query.where(Job.mode == mode)

        if level and level != "All":
            query = query.where(Job.level == level)

        if q:
            query = query.where(
                or_(
                    Job.title.ilike(f"%{q}%"),
                    Job.company_name.ilike(f"%{q}%"),
                    Job.description.ilike(f"%{q}%")
                )
            )

        # Date range filter (powers "Daily" and "Latest" tabs)
        if date_filter == "today":
            today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
            query = query.where(Job.posted_at >= today_start)
        elif date_filter == "week":
            week_ago = datetime.combine(date.today() - timedelta(days=7), datetime.min.time()).replace(tzinfo=timezone.utc)
            query = query.where(Job.posted_at >= week_ago)

        # Sort order
        if sort == "newest":
            query = query.order_by(Job.posted_at.desc())
        else:
            query = query.order_by(Job.match_score.desc())

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def _throttled_expire(self) -> None:
        """Run _auto_expire_overdue() at most once every 5 minutes globally.
        Prevents an extra DB UPDATE on every single /jobs list request."""
        global _last_expire_run
        now = datetime.now(timezone.utc)
        if _last_expire_run is not None:
            elapsed = (now - _last_expire_run).total_seconds()
            if elapsed < _EXPIRE_INTERVAL_SECONDS:
                return
        _last_expire_run = now
        await self._auto_expire_overdue()

    async def _auto_expire_overdue(self) -> int:
        """Inline deadline-based expiry: marks any job with deadline < today as expired.
        Called via _throttled_expire() at most every 5 minutes."""
        try:
            today = date.today()
            stmt = (
                update(Job)
                .where(Job.deadline < today)
                .where(Job.is_expired.is_(False))
                .values(is_expired=True)
            )
            result = await self.session.execute(stmt)
            if result.rowcount:
                await self.session.flush()
            return result.rowcount
        except Exception:
            return 0  # never let cleanup break the feed

    async def expire_overdue(self) -> int:
        """Mark all jobs whose deadline is past today as is_expired = True."""
        today = date.today()
        stmt = update(Job).where(Job.deadline < today).where(Job.is_expired.is_(False)).values(is_expired=True)
        result = await self.session.execute(stmt)
        return result.rowcount

    async def update(self, job_id: int, data: dict) -> Job | None:
        """Update job fields."""
        job = await self.get(job_id)
        if job:
            for key, value in data.items():
                if hasattr(job, key) and key not in ("id", "created_at"):
                    setattr(job, key, value)
            job.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
        return job

    async def delete(self, job_id: int) -> bool:
        """Delete a job by ID."""
        job = await self.get(job_id)
        if job:
            await self.session.delete(job)
            await self.session.flush()
            return True
        return False
