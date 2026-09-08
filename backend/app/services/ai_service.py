"""
Enhanced AI service:
- User context injection for personalized career advice
- Chat session persistence (CRUD)
- System prompt builder with live user data
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sqlalchemy_models import (
    User, Application, CVVersion, Goal, Interview, ChatSession
)


async def get_user_context(session: AsyncSession, user_id: int) -> dict:
    """
    Pull live user data from the database to inject into the AI system prompt.
    Returns a context dict with key career metrics.
    """
    # --- User profile ---
    user_result = await session.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    # --- Applications overview ---
    apps_result = await session.execute(
        select(Application).where(Application.user_id == user_id)
    )
    applications = apps_result.scalars().all()
    by_stage: dict[str, int] = {}
    for a in applications:
        stage = str(a.stage.value) if hasattr(a.stage, 'value') else str(a.stage)
        by_stage[stage] = by_stage.get(stage, 0) + 1

    # --- CV versions ---
    cv_result = await session.execute(
        select(CVVersion).where(CVVersion.user_id == user_id)
    )
    cvs = cv_result.scalars().all()
    best_cv = max(cvs, key=lambda c: c.ats_score or 0, default=None)

    # --- Goals ---
    goals_result = await session.execute(
        select(Goal).where(Goal.user_id == user_id)
    )
    goals = goals_result.scalars().all()
    active_goals = [g for g in goals if g.current < g.target]

    # --- Interviews ---
    iv_result = await session.execute(
        select(Interview).where(
            Interview.user_id == user_id,
            Interview.status == "scheduled"
        )
    )
    upcoming_interviews = iv_result.scalars().all()

    return {
        "name": f"{user.first_name} {user.last_name}".strip() if user else "User",
        "title": user.title or "Job Seeker" if user else "Job Seeker",
        "location": user.location or "" if user else "",
        "skills": (user.skills or [])[:15] if user else [],
        "years_exp": user.years_experience or 0 if user else 0,
        "total_applications": len(applications),
        "applications_by_stage": by_stage,
        "active_goals": [{"label": g.label, "current": g.current, "target": g.target} for g in active_goals[:3]],
        "upcoming_interviews": len(upcoming_interviews),
        "cv_count": len(cvs),
        "best_cv_ats": best_cv.ats_score if best_cv else 0,
        "best_cv_skills": (best_cv.skills or [])[:10] if best_cv else [],
    }


def build_system_prompt(context: dict) -> str:
    """Build a rich, personalized system prompt using live user context."""
    name = context.get("name", "User")
    title = context.get("title", "Job Seeker")
    skills = context.get("skills", [])
    years = context.get("years_exp", 0)
    total_apps = context.get("total_applications", 0)
    stage_map = context.get("applications_by_stage", {})
    interviews = context.get("upcoming_interviews", 0)
    goals = context.get("active_goals", [])
    best_ats = context.get("best_cv_ats", 0)
    best_skills = context.get("best_cv_skills", [])

    stage_str = ", ".join(f"{k}: {v}" for k, v in stage_map.items()) if stage_map else "none yet"
    goals_str = "; ".join(f"{g['label']} ({g['current']}/{g['target']})" for g in goals) if goals else "no active goals"
    skills_str = ", ".join(skills) if skills else "not specified"
    best_skills_str = ", ".join(best_skills) if best_skills else "not specified"

    return (
        f"You are Denno1, a world-class AI career strategist and personal job search coach. "
        f"You are speaking directly to {name}, a {title} with {years} years of experience. "
        f"\n\nHere is {name}'s live career dashboard context:\n"
        f"- Total job applications: {total_apps} (stages: {stage_str})\n"
        f"- Upcoming interviews: {interviews}\n"
        f"- Best CV ATS score: {best_ats}%\n"
        f"- CV highlighted skills: {best_skills_str}\n"
        f"- Profile skills: {skills_str}\n"
        f"- Active goals: {goals_str}\n"
        f"\nUse this context to personalize your advice. "
        f"Always respond with structured markdown (## headers, bullet points, **bold** key terms). "
        f"Include salary metrics in KES/USD when relevant. "
        f"Use the STAR framework for interview prep. "
        f"Reference the user's actual skills, application count, and goals when giving advice. "
        f"Be direct, concise, and actionable. Avoid vague or generic advice.\n"
        f"When appropriate, recommend concrete actions by embedding 1-click action tags on their own line:\n"
        f"- [ACTION:MOCK_INTERVIEW]\n"
        f"- [ACTION:CREATE_GOAL|label=Apply to 5 jobs this week|target=5]\n"
        f"- [ACTION:NAVIGATE|path=/cover-letter|label=Open Cover Letter Studio]\n"
        f"- [ACTION:NAVIGATE|path=/learning|label=Open Learning Hub]\n"
        f"- [ACTION:NAVIGATE|path=/cv|label=Run ATS CV Analysis]"
    )


async def save_chat_session(
    session: AsyncSession,
    user_id: int,
    messages: list[dict],
    session_id: Optional[int] = None,
    title: Optional[str] = None,
) -> "ChatSession":
    """Create or update a chat session with messages."""
    if session_id:
        result = await session.execute(
            select(ChatSession).where(
                ChatSession.id == session_id,
                ChatSession.user_id == user_id,
            )
        )
        chat_session = result.scalar_one_or_none()
        if chat_session:
            chat_session.messages = messages
            if title:
                chat_session.title = title
            await session.flush()
            return chat_session

    # Create new session
    if not title and messages:
        # Auto-generate title from first user message
        first_user = next((m for m in messages if m.get("role") == "user"), None)
        title = (first_user["content"][:50] + "…") if first_user else "New Chat"

    new_session = ChatSession(
        user_id=user_id,
        title=title or "New Chat",
        messages=messages,
    )
    session.add(new_session)
    await session.flush()
    await session.refresh(new_session)
    return new_session
