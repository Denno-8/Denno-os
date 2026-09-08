"""
Follow-up Sequence Scheduler & Draft Generator Service
Detects applications awaiting response for >= 7 days and generates polite, high-converting follow-up drafts.
"""
from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.sqlalchemy_models import Application, ApplicationStage, User


class FollowupService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_due_followups(self, user_id: int, days_threshold: int = 7) -> List[Dict[str, Any]]:
        """
        Scans applications that are currently in Applied, Confirmed, or Assessment stage,
        where the last update/application date is >= days_threshold days ago.
        """
        cutoff_date = date.today() - timedelta(days=days_threshold)

        stmt = select(Application).where(
            and_(
                Application.user_id == user_id,
                Application.stage.in_([
                    ApplicationStage.APPLIED,
                    ApplicationStage.CONFIRMED,
                    ApplicationStage.ASSESSMENT,
                    ApplicationStage.TECHNICAL
                ])
            )
        )
        res = await self.db.execute(stmt)
        apps = res.scalars().all()

        due_list = []
        for app in apps:
            app_date = app.date_applied if app.date_applied else app.created_at.date()
            if app_date <= cutoff_date:
                days_since = (date.today() - app_date).days
                due_list.append({
                    "id": app.id,
                    "company_name": app.company_name,
                    "role": app.role,
                    "stage": app.stage.value if hasattr(app.stage, "value") else str(app.stage),
                    "date_applied": str(app_date),
                    "days_since_applied": days_since,
                    "recruiter_email": app.recruiter_email or f"careers@{app.company_name.lower().replace(' ', '')}.com",
                    "urgency": "High" if days_since >= 14 else "Medium"
                })

        return due_list

    async def generate_followup_draft(self, user_id: int, application_id: int) -> Dict[str, Any]:
        """
        Generates a customized, professional follow-up email draft for an application.
        """
        app_res = await self.db.execute(
            select(Application).where(and_(Application.id == application_id, Application.user_id == user_id))
        )
        app = app_res.scalars().first()
        if not app:
            return {"error": "Application not found"}

        user_res = await self.db.execute(select(User).where(User.id == user_id))
        user_obj = user_res.scalars().first()

        applicant_name = f"{user_obj.first_name} {user_obj.last_name}".strip() if user_obj and user_obj.first_name else "Dennis K"
        applicant_title = user_obj.title if user_obj and user_obj.title else app.role

        app_date_str = str(app.date_applied) if app.date_applied else "recently"
        skills_str = ", ".join(app.required_skills[:3]) if app.required_skills else "software engineering & technical problem solving"

        subject = f"Following up on Application - {app.role} - {applicant_name}"
        
        body = (
            f"Dear Hiring Team at {app.company_name},\n\n"
            f"I hope this email finds you well.\n\n"
            f"I am writing to politely follow up on my application for the {app.role} position submitted on {app_date_str}. "
            f"I remain extremely enthusiastic about the opportunity to contribute to {app.company_name}, particularly given my background in {skills_str}.\n\n"
            f"Please let me know if you require any additional details, work samples, or references from my side. "
            f"I look forward to hearing about the next steps in your recruitment process.\n\n"
            f"Thank you for your time and consideration.\n\n"
            f"Best regards,\n"
            f"{applicant_name}\n"
            f"{user_obj.email if user_obj else 'deno14619@gmail.com'} | {user_obj.phone if user_obj else '+254 716 949 061'}"
        )

        return {
            "application_id": app.id,
            "company_name": app.company_name,
            "role": app.role,
            "recruiter_email": app.recruiter_email or f"careers@{app.company_name.lower().replace(' ', '')}.com",
            "subject": subject,
            "body": body,
            "suggested_send_date": str(date.today())
        }
