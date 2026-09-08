from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.repositories.interview_repository import InterviewRepository
from app.schemas.interview import InterviewCreate, InterviewUpdate, PostMortemCreate
from app.repositories.calendar_event_repository import CalendarEventRepository
from app.repositories.note_repository import NoteRepository
from app.repositories.application_repository import ApplicationRepository


def _serialize(interview) -> dict:
    return {
        "id": str(interview.id),
        "application_id": str(interview.application_id) if getattr(interview, "application_id", None) else "",
        "type": getattr(interview, "type", "Technical"),
        "scheduled_at": interview.scheduled_at,
        "location": getattr(interview, "location", "") or "",
        "status": getattr(interview, "status", "scheduled"),
        "prep_checklist": getattr(interview, "prep_checklist", {}) or {},
        "behavioral_questions": getattr(interview, "behavioral_questions", []) or [],
        "technical_questions": getattr(interview, "technical_questions", []) or [],
        "post_interview_notes": getattr(interview, "post_interview_notes", "") or "",
        "outcome": getattr(interview, "outcome", None),
        "questions_asked": getattr(interview, "questions_asked", []) or [],
        "what_went_well": getattr(interview, "what_went_well", "") or "",
        "what_to_improve": getattr(interview, "what_to_improve", "") or "",
        "overall_confidence": getattr(interview, "overall_confidence", None),
        "follow_up_actions": getattr(interview, "follow_up_actions", []) or [],
        "post_mortem_done": getattr(interview, "post_mortem_done", False),
        "created_at": interview.created_at,
    }


class InterviewService:
    def __init__(self, db: AsyncSession):
        self.repo = InterviewRepository(db)
        self.cal_repo = CalendarEventRepository(db)
        self.note_repo = NoteRepository(db)
        self.app_repo = ApplicationRepository(db)

    async def create(self, user_id: int, payload: InterviewCreate) -> dict:
        doc = payload.model_dump()
        doc["user_id"] = user_id
        if "application_id" in doc and doc["application_id"]:
            doc["application_id"] = int(doc["application_id"])
        doc["prep_checklist"] = {" STAR Prep": False, "System Design": False, "Resume Deep Dive": False}
        doc["status"] = "scheduled"
        doc["post_interview_notes"] = ""
        doc["outcome"] = None

        target_dt = payload.scheduled_at

        # 1. Conflict detection check: search existing user interviews within ±2 hours
        existing = await self.repo.list_for_user(user_id, upcoming_only=True)
        has_conflict = False
        conflict_warning = None
        for item in existing:
            if item.scheduled_at:
                delta = abs((item.scheduled_at - target_dt).total_seconds())
                if delta < 7200:  # 2 hours
                    has_conflict = True
                    conflict_warning = f"Conflict warning: You have another interview scheduled at {item.scheduled_at.strftime('%H:%M')}!"
                    break

        created = await self.repo.create(doc)

        # 2. Auto-schedule Calendar Event & Prep-time Buffer on calendar
        app = await self.app_repo.get(created.application_id, user_id) if created.application_id else None
        company_name = app.company_name if app else "Company"

        # Main interview event
        await self.cal_repo.create({
            "user_id": user_id,
            "title": f"Interview: {created.type} with {company_name}",
            "type": "Interview",
            "date": target_dt.date(),
            "time": target_dt.strftime("%H:%M"),
            "color": "purple",
            "application_id": created.application_id
        })

        # Prep-time Buffer (2 hours prior)
        prep_dt = target_dt - timedelta(hours=2)
        await self.cal_repo.create({
            "user_id": user_id,
            "title": f"⚡ Prep Buffer: {created.type} ({company_name})",
            "type": "Task",
            "date": prep_dt.date(),
            "time": prep_dt.strftime("%H:%M"),
            "color": "amber",
            "application_id": created.application_id
        })

        res = _serialize(created)
        res["has_conflict"] = has_conflict
        res["conflict_warning"] = conflict_warning
        return res

    async def list(self, user_id: int, upcoming_only: bool) -> list[dict]:
        interviews = await self.repo.list_for_user(user_id, upcoming_only)
        return [_serialize(interview) for interview in interviews]

    async def get(self, interview_id: int, user_id: int) -> dict | None:
        interview = await self.repo.get(interview_id, user_id)
        return _serialize(interview) if interview else None

    async def update(self, interview_id: int, user_id: int, payload: InterviewUpdate) -> dict | None:
        patch = payload.model_dump(exclude_none=True)
        if "application_id" in patch and patch["application_id"] is not None:
            patch["application_id"] = int(patch["application_id"])
        interview = await self.repo.update(interview_id, user_id, patch)
        return _serialize(interview) if interview else None

    async def save_post_mortem(self, interview_id: int, user_id: int, payload: PostMortemCreate) -> dict:
        """Saves structured reflection AND auto-feeds post-mortem into Knowledge Base notes."""
        interview = await self.repo.get(interview_id, user_id)
        if not interview:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")

        q_asked = [q.model_dump() for q in payload.questions_asked]
        patch = {
            "questions_asked": q_asked,
            "what_went_well": payload.what_went_well,
            "what_to_improve": payload.what_to_improve,
            "overall_confidence": payload.overall_confidence,
            "follow_up_actions": payload.follow_up_actions,
            "post_interview_notes": payload.post_interview_notes,
            "outcome": payload.outcome,
            "post_mortem_done": True,
            "status": "completed" if payload.outcome else interview.status
        }

        updated = await self.repo.update(interview_id, user_id, patch)

        # Auto-feed reflection into Knowledge Vault notes
        app = await self.app_repo.get(interview.application_id, user_id) if interview.application_id else None
        company_name = app.company_name if app else "Interview"
        role_title = app.role if app else interview.type

        note_body = (
            f"# Post-Mortem Reflection: {role_title} at {company_name}\n\n"
            f"**Overall Confidence Score**: {payload.overall_confidence}/10\n"
            f"**Outcome Status**: {payload.outcome or 'Pending'}\n\n"
            f"### What Went Well\n{payload.what_went_well or 'N/A'}\n\n"
            f"### Key Improvements for Next Time\n{payload.what_to_improve or 'N/A'}\n\n"
            f"### Questions Asked & Answers\n"
        )
        for q in q_asked:
            note_body += f"- **Q**: {q['question']}\n  - **A**: {q['answer_given']} (Rating: {q['quality_rating']}/5)\n"

        if payload.follow_up_actions:
            note_body += "\n### Follow-up Action Items\n" + "\n".join(f"- [ ] {a}" for a in payload.follow_up_actions)

        await self.note_repo.create({
            "user_id": user_id,
            "title": f"Post-Mortem: {company_name} - {role_title}",
            "body": note_body,
            "category": "Interviews",
            "tags": ["Interview", "Post-Mortem", company_name]
        })

        return _serialize(updated)

    async def delete(self, interview_id: int, user_id: int) -> bool:
        return await self.repo.delete(interview_id, user_id)

    async def generate_mock_questions(self, role_title: str, company_name: str, interview_type: str = "Technical") -> dict:
        """Generates dynamic behavioral (STAR) and technical questions tailored to role & company."""
        if interview_type == "Technical":
            questions = [
                f"How would you design a high-throughput, low-latency microservice for {company_name}'s workload?",
                f"Describe a complex architectural tradeoff you made in a previous {role_title} project.",
                f"How do you handle database query optimization and indexing when scaling past 1 million records?",
                f"Explain how you implement distributed locking or idempotent processing in event-driven systems.",
            ]
        else:  # Behavioral / HR
            questions = [
                f"Tell me about a time you had a technical disagreement with a team member. How did you resolve it?",
                f"Describe a situation where a production system broke or went down under your watch. How did you respond?",
                f"Give an example of a project where requirements changed midway through. How did you adapt?",
                f"Why are you interested in joining {company_name} as a {role_title}?",
            ]

        return {
            "company_name": company_name,
            "role_title": role_title,
            "interview_type": interview_type,
            "questions": questions,
        }

    async def evaluate_star_response(self, question: str, response_text: str) -> dict:
        """Evaluates a candidate's response using the STAR method (Situation, Task, Action, Result)."""
        lower = response_text.lower()
        has_situation = any(k in lower for k in ["situation", "when", "while", "at my previous", "working at", "project"])
        has_task = any(k in lower for k in ["task", "goal", "objective", "needed to", "had to", "responsibility"])
        has_action = any(k in lower for k in ["action", "built", "implemented", "developed", "created", "refactored", "designed", "led", "solved"])
        has_result = any(k in lower for k in ["result", "outcome", "improved", "reduced", "increased", "%", "percent", "saved", "achieved", "delivered"])

        score = sum([25 if has_situation else 10, 25 if has_task else 10, 25 if has_action else 10, 25 if has_result else 10])

        feedback = []
        if not has_situation:
            feedback.append("Clarify the initial Situation context (where and when this occurred).")
        if not has_task:
            feedback.append("Specify your specific Task or objective clearly.")
        if not has_action:
            feedback.append("Elaborate on the concrete technical Actions you personally took.")
        if not has_result:
            feedback.append("Quantify the Result (e.g. latency reduced by 40%, throughput increased, user impact).")

        if not feedback:
            feedback.append("Excellent response! Full STAR structure with clear impact metrics.")

        return {
            "question": question,
            "response_text": response_text,
            "star_score": score,
            "star_breakdown": {
                "situation": has_situation,
                "task": has_task,
                "action": has_action,
                "result": has_result,
            },
            "feedback": feedback,
        }
