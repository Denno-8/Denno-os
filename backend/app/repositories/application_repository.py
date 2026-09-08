"""
All direct database access for the applications table lives here.
Services call this layer; routes never touch the DB directly.
"""
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.sqlalchemy_models import Application


class ApplicationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: dict) -> Application:
        """Create a new application."""
        application = Application(**data)
        self.session.add(application)
        await self.session.flush()
        return application

    async def find_existing(
        self, user_id: int, source_job_id: str | None = None, company_name: str | None = None, role: str | None = None
    ) -> Application | None:
        """
        Find a pre-existing application for the user to prevent true duplicates.

        Matching strategy (in priority order):
        1. source_job_id exact match — most reliable; also verifies company+role when
           provided to guard against stale re-indexed IDs.
        2. source_job_id + company_name + role fallback — only runs when a
           source_job_id WAS provided but the ID-only lookup returned nothing,
           meaning the job may have been re-indexed with a different PK.

        A bare company+role match with NO source_job_id is intentionally NOT
        performed here.  Doing so causes false duplicate detection: a manually-added
        application (from the Applications tracker) would falsely block a real apply
        action on any job card that shares the same company name and title.
        """
        if source_job_id:
            try:
                # 1. Strict ID match
                res = await self.session.execute(
                    select(Application).where(
                        (Application.user_id == user_id) & (Application.source_job_id == str(source_job_id))
                    )
                )
                found = res.scalars().first()
                if found:
                    if company_name and role:
                        if (
                            found.company_name.lower().strip() == company_name.lower().strip() and
                            found.role.lower().strip() == role.lower().strip()
                        ):
                            return found
                    else:
                        return found
            except Exception:
                pass

        # 2. Company name + Role match guard (prevents duplicate applications for same position)
        if company_name and role:
            try:
                clean_company = company_name.lower().strip()
                clean_role = role.lower().strip()
                res = await self.session.execute(
                    select(Application).where(
                        (Application.user_id == user_id) &
                        (func.trim(func.lower(Application.company_name)) == clean_company) &
                        (func.trim(func.lower(Application.role)) == clean_role)
                    )
                )
                existing = res.scalars().first()
                if existing:
                    return existing
            except Exception:
                pass

        return None

    async def get(self, app_id: int, user_id: int) -> Application | None:
        """Fetch application by ID, scoped to user."""
        result = await self.session.execute(
            select(Application).where(
                (Application.id == app_id) & (Application.user_id == user_id)
            )
        )
        return result.scalars().first()

    async def list_for_user(
        self, user_id: int, stage: str | None = None, skip: int = 0, limit: int = 100
    ) -> list[Application]:
        """List applications for a user, optionally filtered by stage."""
        query = select(Application).where(Application.user_id == user_id)
        
        if stage:
            query = query.where(Application.stage == stage)
        
        query = query.order_by(Application.date_applied.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def update(self, app_id: int, user_id: int, data: dict) -> Application | None:
        """Update application fields."""
        application = await self.get(app_id, user_id)
        if application:
            for key, value in data.items():
                if hasattr(application, key) and key not in ("id", "created_at", "user_id"):
                    setattr(application, key, value)
            application.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
        return application

    async def delete(self, app_id: int, user_id: int) -> bool:
        """Delete application by ID, scoped to user."""
        application = await self.get(app_id, user_id)
        if application:
            await self.session.delete(application)
            await self.session.flush()
            return True
        return False

    async def aggregate_by_stage(self, user_id: int) -> dict[str, int]:
        """Count applications by stage for a user."""
        result = await self.session.execute(
            select(Application.stage, func.count(Application.id)).where(
                Application.user_id == user_id
            ).group_by(Application.stage)
        )
        return {stage: count for stage, count in result.all()}

    async def averages(self, user_id: int) -> dict:
        """Calculate average scores and total count for user's applications."""
        result = await self.session.execute(
            select(
                func.count(Application.id).label("total"),
                func.avg(Application.match_score).label("avg_match"),
                func.avg(Application.ats_score).label("avg_ats"),
            ).where(Application.user_id == user_id)
        )
        row = result.first()
        if row:
            return {
                "total": row.total or 0,
                "avg_match": float(row.avg_match or 0),
                "avg_ats": float(row.avg_ats or 0),
            }
        return {"total": 0, "avg_match": 0, "avg_ats": 0}
