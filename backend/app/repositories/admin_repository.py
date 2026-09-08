"""
Admin repository — raw database queries for platform-wide admin operations.
All queries bypass user_id scoping (admin sees everything).
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete
from app.models.sqlalchemy_models import (
    User, Application, Job, Company, Email,
    Interview, CalendarEvent, Goal, Note, CVVersion, LearningCourse
)


class AdminRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ─── Users ────────────────────────────────────────────────────────────────
    async def list_users(
        self, skip: int = 0, limit: int = 100, q: str = "", role: str = "", active_status: str = ""
    ) -> list:
        stmt = select(User).order_by(User.created_at.desc())
        if q:
            stmt = stmt.where(
                User.email.ilike(f"%{q}%") | User.first_name.ilike(f"%{q}%") | User.last_name.ilike(f"%{q}%")
            )
        if role:
            stmt = stmt.where(User.role == role)
        if active_status == "active":
            stmt = stmt.where(User.is_active.is_(True))
        elif active_status == "suspended":
            stmt = stmt.where(User.is_active.is_(False))

        stmt = stmt.offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_user(self, user_id: int) -> User | None:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def update_user(self, user_id: int, patch: dict) -> User | None:
        await self.session.execute(
            update(User).where(User.id == user_id).values(**patch)
        )
        return await self.get_user(user_id)

    async def delete_user(self, user_id: int) -> bool:
        result = await self.session.execute(delete(User).where(User.id == user_id))
        return result.rowcount > 0

    async def count_users(self) -> int:
        result = await self.session.execute(select(func.count(User.id)))
        return result.scalar_one() or 0

    async def count_admins(self) -> int:
        result = await self.session.execute(
            select(func.count(User.id)).where(User.role == "admin")
        )
        return result.scalar_one() or 0

    # ─── User-level stats ─────────────────────────────────────────────────────
    async def user_application_count(self, user_id: int) -> int:
        result = await self.session.execute(
            select(func.count(Application.id)).where(Application.user_id == user_id)
        )
        return result.scalar_one() or 0

    # ─── Platform analytics ───────────────────────────────────────────────────
    async def platform_analytics(self) -> dict:
        total_users      = (await self.session.execute(select(func.count(User.id)))).scalar_one() or 0
        total_apps       = (await self.session.execute(select(func.count(Application.id)))).scalar_one() or 0
        total_jobs       = (await self.session.execute(select(func.count(Job.id)))).scalar_one() or 0
        total_companies  = (await self.session.execute(select(func.count(Company.id)))).scalar_one() or 0
        total_courses    = (await self.session.execute(select(func.count(LearningCourse.id)))).scalar_one() or 0
        total_emails     = (await self.session.execute(select(func.count(Email.id)))).scalar_one() or 0
        total_interviews = (await self.session.execute(select(func.count(Interview.id)))).scalar_one() or 0

        offers_result = await self.session.execute(
            select(func.count(Application.id)).where(
                Application.stage.in_(["Offer", "Accepted"])
            )
        )
        total_offers = offers_result.scalar_one() or 0

        avg_match_result = await self.session.execute(
            select(func.avg(Application.match_score))
        )
        avg_match = round(avg_match_result.scalar_one() or 0)

        return {
            "total_users": total_users,
            "total_applications": total_apps,
            "total_jobs": total_jobs,
            "total_companies": total_companies,
            "total_courses": total_courses,
            "total_emails": total_emails,
            "total_interviews": total_interviews,
            "total_offers": total_offers,
            "avg_match_score": avg_match,
            "platform_offer_rate": round(total_offers / total_apps * 100) if total_apps else 0,
        }

    # ─── Jobs admin ───────────────────────────────────────────────────────────
    async def list_all_jobs(
        self, skip: int = 0, limit: int = 100, mode: str = "", level: str = "", is_expired: str = ""
    ) -> list:
        stmt = select(Job).order_by(Job.id.desc())
        if mode:
            stmt = stmt.where(Job.mode.ilike(f"%{mode}%"))
        if level:
            stmt = stmt.where(Job.level.ilike(f"%{level}%"))
        if is_expired == "true":
            stmt = stmt.where(Job.is_expired.is_(True))
        elif is_expired == "false":
            stmt = stmt.where(Job.is_expired.is_(False))

        stmt = stmt.offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def delete_job(self, job_id: int) -> bool:
        result = await self.session.execute(delete(Job).where(Job.id == job_id))
        return result.rowcount > 0

    # ─── Companies admin ──────────────────────────────────────────────────────
    async def list_all_companies(
        self, skip: int = 0, limit: int = 100, tier: str = "", sector: str = ""
    ) -> list:
        stmt = select(Company).order_by(Company.id.desc())
        if tier and tier.isdigit():
            stmt = stmt.where(Company.tier == int(tier))
        if sector:
            stmt = stmt.where(Company.sector.ilike(f"%{sector}%"))

        stmt = stmt.offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def delete_company(self, company_id: int) -> bool:
        result = await self.session.execute(delete(Company).where(Company.id == company_id))
        return result.rowcount > 0
