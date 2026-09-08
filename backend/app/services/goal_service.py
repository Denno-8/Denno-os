from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.goal_repository import GoalRepository
from app.schemas.goal import GoalCreate, GoalUpdate


def _serialize(goal) -> dict:
    return {
        "id": str(goal.id),
        "label": getattr(goal, "label", "") or "",
        "category": getattr(goal, "category", "Applications") or "Applications",
        "current": getattr(goal, "current", 0) or 0,
        "target": getattr(goal, "target", 1) or 1,
        "deadline": getattr(goal, "deadline", None),
        "created_at": goal.created_at,
    }



class GoalService:
    def __init__(self, db: AsyncSession):
        self.repo = GoalRepository(db)

    async def create(self, user_id: int, payload: GoalCreate) -> dict:
        doc = payload.model_dump(exclude_none=True)
        doc["user_id"] = user_id
        created = await self.repo.create(doc)
        return _serialize(created)

    async def list(self, user_id: int) -> list[dict]:
        goals = await self.repo.list_for_user(user_id)
        return [_serialize(goal) for goal in goals]

    async def update(self, goal_id: int, user_id: int, payload: GoalUpdate) -> dict | None:
        patch = payload.model_dump(exclude_none=True)
        goal = await self.repo.update(goal_id, user_id, patch)
        return _serialize(goal) if goal else None

    async def increment(self, goal_id: int, user_id: int, delta: int) -> dict | None:
        goal = await self.repo.increment(goal_id, user_id, delta)
        return _serialize(goal) if goal else None

    async def delete(self, goal_id: int, user_id: int) -> bool:
        return await self.repo.delete(goal_id, user_id)

    async def get_velocity_projections(self, user_id: int) -> dict:
        """Calculates weekly application submission velocity, interview response rate, and projects estimated time-to-offer."""
        from app.repositories.application_repository import ApplicationRepository
        app_repo = ApplicationRepository(self.repo.session)
        apps = await app_repo.list_for_user(user_id, limit=500)

        total_apps = len(apps)
        if total_apps == 0:
            return {
                "total_applications": 0,
                "weekly_velocity": 0,
                "interview_conversion_pct": 0,
                "projected_weeks_to_offer": 4.0,
                "status": "Getting Started",
                "recommendation": "Submit 5-10 targeted applications per week with 85%+ ATS match score."
            }

        interviews = sum(1 for a in apps if a.stage in ["Technical", "HR Interview", "Final Interview", "Assessment", "Offer", "Accepted"])
        offers = sum(1 for a in apps if a.stage in ["Offer", "Accepted"])

        interview_rate = round((interviews / total_apps) * 100)
        offer_rate = round((offers / total_apps) * 100)

        # Estimate weekly velocity (assume activity spans last 4 weeks)
        weekly_vel = max(1.0, round(total_apps / 4.0, 1))

        # Project weeks needed to reach 1 offer
        target_apps_for_offer = 25
        needed = max(0, target_apps_for_offer - total_apps)
        weeks_to_offer = round(needed / weekly_vel, 1) if weekly_vel > 0 else 2.0
        if offers > 0:
            weeks_to_offer = 0.0

        return {
            "total_applications": total_apps,
            "weekly_velocity": weekly_vel,
            "interview_conversion_pct": interview_rate,
            "offer_conversion_pct": offer_rate,
            "projected_weeks_to_offer": max(0.5, weeks_to_offer),
            "status": "On Track" if weekly_vel >= 5 else "Pacing Slow",
            "recommendation": "Maintain weekly submission velocity above 5 applications to maximize offer probability."
        }
