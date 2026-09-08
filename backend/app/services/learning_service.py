from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.learning_repository import CourseRepository, ProgressRepository
from app.schemas.learning import CourseCreate, CourseUpdate


class LearningService:
    def __init__(self, db: AsyncSession):
        self.courses = CourseRepository(db)
        self.progress = ProgressRepository(db)

    async def create_course(self, payload: CourseCreate) -> dict:
        created = await self.courses.create(payload.model_dump())
        return self._merge(created, {})

    async def list_for_user(self, user_id: int, category: str | None) -> list[dict]:
        courses = await self.courses.list(category)
        progress_list = await self.progress.list_for_user(user_id)
        progress_by_course = {
            str(p.course_id): {"lessons_completed": p.progress_percent, "status": p.status}
            for p in progress_list
        }
        return [self._merge(course, progress_by_course) for course in courses]

    async def categories(self) -> list[str]:
        return await self.courses.categories()



    async def update_course(self, course_id: int, payload: CourseUpdate) -> dict | None:
        patch = payload.model_dump(exclude_none=True)
        course = await self.courses.update(course_id, patch)
        if not course:
            return None
        return self._merge(course, {})

    async def delete_course(self, course_id: int) -> bool:
        deleted = await self.courses.delete(course_id)
        if deleted:
            await self.progress.delete_for_course(course_id)
        return deleted

    async def update_progress(self, user_id: int, course_id: int, lessons_completed: int) -> dict:
        course = await self.courses.get(course_id)
        if not course:
            raise ValueError("Course not found")

        lessons_completed = min(lessons_completed, course.lesson_count)
        status = (
            "complete" if lessons_completed >= course.lesson_count
            else "in_progress" if lessons_completed > 0
            else "not_started"
        )
        await self.progress.upsert(user_id, course_id, lessons_completed, status)

        progress_list = await self.progress.list_for_user(user_id)
        progress_by_course = {
            str(p.course_id): {"lessons_completed": p.progress_percent, "status": p.status}
            for p in progress_list
        }
        return self._merge(course, progress_by_course)

    @staticmethod
    def _merge(course, progress_by_course: dict) -> dict:
        course_id = str(course.id)
        prog = progress_by_course.get(course_id, {})
        return {
            "id": course_id,
            "title": course.title,
            "category": course.category,
            "level": course.level or "Beginner",
            "duration_minutes": course.duration_minutes or 0,
            "lesson_count": course.lesson_count or 1,
            "url": course.url or "",
            "linked_skill": course.linked_skill or "",
            "lessons_completed": prog.get("lessons_completed", 0),
            "status": prog.get("status", "not_started"),
        }

    async def get_skill_gap_heatmap(self, user_id: int) -> dict:
        """Calculates missing skill frequency across target jobs vs user's CV skill profile."""
        from collections import Counter
        from app.repositories.job_repository import JobRepository
        from app.repositories.cv_version_repository import CVVersionRepository

        job_repo = JobRepository(self.courses.session)
        cv_repo = CVVersionRepository(self.courses.session)

        all_jobs = await job_repo.list(limit=200, include_expired=False)
        user_cvs = await cv_repo.list_for_user(user_id)

        # Collect user's existing skills across CVs
        candidate_skills = set()
        for cv in user_cvs:
            for sk in (cv.skills or []):
                candidate_skills.add(sk.lower().strip())

        # Count total demand for skills across target jobs
        total_jobs_count = max(1, len(all_jobs))
        demand_counter = Counter()
        missing_counter = Counter()

        for j in all_jobs:
            for sk in (j.required_skills or []):
                clean_sk = sk.strip()
                sk_lower = clean_sk.lower()
                demand_counter[clean_sk] += 1
                if sk_lower not in candidate_skills:
                    missing_counter[clean_sk] += 1

        top_missing = []
        for sk, count in missing_counter.most_common(8):
            pct = round((count / total_jobs_count) * 100)
            top_missing.append({
                "skill": sk,
                "missing_count": count,
                "target_job_pct": pct,
                "recommendation": f"Add {sk} project or certification to your portfolio to match {pct}% of openings."
            })

        return {
            "total_jobs_analyzed": total_jobs_count,
            "candidate_known_skills": list(candidate_skills)[:20],
            "top_missing_skills": top_missing,
        }
