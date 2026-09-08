from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.sqlalchemy_models import LearningCourse, UserCourseProgress


class CourseRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: dict) -> LearningCourse:
        """Create a new learning course."""
        course = LearningCourse(**data)
        self.session.add(course)
        await self.session.flush()
        return course

    async def list(self, category: str | None = None) -> list[LearningCourse]:
        """List all courses, optionally filtered by category."""
        query = select(LearningCourse)
        
        if category and category != "All":
            query = query.where(LearningCourse.category == category)
        
        result = await self.session.execute(query)
        return result.scalars().all()

    async def categories(self) -> list[str]:
        """List all unique course categories."""
        from sqlalchemy import func
        result = await self.session.execute(
            select(func.distinct(LearningCourse.category)).where(LearningCourse.category != "")
        )
        return [row[0] for row in result.all() if row[0]]


    async def get(self, course_id: int) -> LearningCourse | None:
        """Fetch course by ID."""
        return await self.session.get(LearningCourse, course_id)

    async def update(self, course_id: int, data: dict) -> LearningCourse | None:
        """Update course fields."""
        course = await self.get(course_id)
        if course:
            for key, value in data.items():
                if hasattr(course, key) and key not in ("id", "created_at"):
                    setattr(course, key, value)
            await self.session.flush()
        return course

    async def delete(self, course_id: int) -> bool:
        """Delete course by ID."""
        course = await self.get(course_id)
        if course:
            await self.session.delete(course)
            await self.session.flush()
            return True
        return False


class ProgressRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get(self, user_id: int, course_id: int) -> UserCourseProgress | None:
        """Fetch progress for a specific user-course pair."""
        result = await self.session.execute(
            select(UserCourseProgress).where(
                (UserCourseProgress.user_id == user_id) &
                (UserCourseProgress.course_id == course_id)
            )
        )
        return result.scalars().first()

    async def list_for_user(self, user_id: int) -> list[UserCourseProgress]:
        """List all course progress for a user."""
        result = await self.session.execute(
            select(UserCourseProgress).where(UserCourseProgress.user_id == user_id)
        )
        return result.scalars().all()

    async def upsert(self, user_id: int, course_id: int, progress_percent: int, status: str) -> UserCourseProgress:
        """Create or update course progress for a user."""
        progress = await self.get(user_id, course_id)
        
        if progress:
            progress.progress_percent = progress_percent
            progress.status = status
            progress.updated_at = datetime.now(timezone.utc)
        else:
            progress = UserCourseProgress(
                user_id=user_id,
                course_id=course_id,
                progress_percent=progress_percent,
                status=status
            )
            self.session.add(progress)
        
        await self.session.flush()
        return progress

    async def delete_for_course(self, course_id: int) -> int:
        """Delete all progress records for a course."""
        result = await self.session.execute(
            select(UserCourseProgress).where(UserCourseProgress.course_id == course_id)
        )
        records = result.scalars().all()
        count = len(records)
        
        for record in records:
            await self.session.delete(record)
        
        await self.session.flush()
        return count
