from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.sqlalchemy_models import Goal


class GoalRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: dict) -> Goal:
        """Create a new goal."""
        goal = Goal(**data)
        self.session.add(goal)
        await self.session.flush()
        return goal

    async def get(self, goal_id: int, user_id: int) -> Goal | None:
        """Fetch goal by ID, scoped to user."""
        result = await self.session.execute(
            select(Goal).where((Goal.id == goal_id) & (Goal.user_id == user_id))
        )
        return result.scalars().first()

    async def list_for_user(self, user_id: int) -> list[Goal]:
        """List all goals for a user, sorted by deadline."""
        result = await self.session.execute(
            select(Goal).where(Goal.user_id == user_id).order_by(Goal.deadline)
        )
        return result.scalars().all()

    async def update(self, goal_id: int, user_id: int, data: dict) -> Goal | None:
        """Update goal fields."""
        goal = await self.get(goal_id, user_id)
        if goal:
            for key, value in data.items():
                if hasattr(goal, key) and key not in ("id", "created_at", "user_id"):
                    setattr(goal, key, value)
            goal.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
        return goal

    async def delete(self, goal_id: int, user_id: int) -> bool:
        """Delete goal by ID, scoped to user."""
        goal = await self.get(goal_id, user_id)
        if goal:
            await self.session.delete(goal)
            await self.session.flush()
            return True
        return False

    async def increment(self, goal_id: int, user_id: int, delta: int) -> Goal | None:
        """Increment (or decrement) the goal's current value, clamped to [0, target]."""
        goal = await self.get(goal_id, user_id)
        if goal:
            new_current = max(0, min(goal.target, (goal.current or 0) + delta))
            goal.current = new_current
            goal.updated_at = datetime.now(timezone.utc)
            await self.session.flush()
        return goal

