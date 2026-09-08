"""
Business logic for applications: sits between the API routes and the
repository. Anything that isn't a raw DB query belongs here.
"""
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.application_repository import ApplicationRepository
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationAnalytics

RESPONDED_STAGES = {
    "Confirmed", "Under Review", "Assessment", "Technical",
    "HR Interview", "Final Interview", "Offer", "Accepted", "Rejected",
}
INTERVIEW_STAGES = {"Technical", "HR Interview", "Final Interview"}


def _serialize(application) -> dict:
    cv_vid = getattr(application, "cv_version_id", None)
    rec_email = getattr(application, "recruiter_email", None)
    apply_m = getattr(application, "apply_method", None) or ("email" if rec_email else "website")
    return {
        "id": str(application.id),
        "company_name": application.company_name,
        "role": application.role,
        "stage": application.stage,
        "date_applied": application.date_applied,
        "required_skills": application.required_skills or [],
        "match_score": application.match_score,
        "ats_score": application.ats_score,
        "salary_range": application.salary_range,
        "notes": application.notes,
        "recruiter_email": rec_email,
        "source_job_id": str(application.source_job_id) if getattr(application, "source_job_id", None) else None,
        "source_url": getattr(application, "source_url", None),
        "apply_method": apply_m,
        "cv_version_id": str(cv_vid) if cv_vid else None,
        "checklist": application.checklist or {},
        "cv_snapshot": getattr(application, "cv_snapshot", None),
        "app_letter_snapshot": getattr(application, "app_letter_snapshot", None),
        "created_at": application.created_at,
        "updated_at": application.updated_at,
    }


class ApplicationService:
    def __init__(self, db: AsyncSession):
        self.repo = ApplicationRepository(db)

    async def create(self, user_id: int, payload: ApplicationCreate) -> dict:
        from fastapi import HTTPException
        from datetime import date, datetime, timezone

        doc = payload.model_dump(exclude_none=True)
        doc["user_id"] = user_id
        doc["stage"] = doc["stage"].value if hasattr(doc["stage"], "value") else doc["stage"]
        doc["checklist"] = {}
        if "company_id" in doc and doc["company_id"] is not None:
            doc["company_id"] = int(doc["company_id"])

        source_jid = doc.get("source_job_id")
        comp_name = doc.get("company_name")
        role_title = doc.get("role")

        # ── Duplicate Application Check ──
        existing_app = await self.repo.find_existing(user_id, source_job_id=source_jid, company_name=comp_name, role=role_title)

        cv_snapshot = None
        if "cv_version_id" in doc and doc["cv_version_id"] is not None:
            try:
                cv_vid = int(doc["cv_version_id"])
                doc["cv_version_id"] = cv_vid
                
                # Fetch CV version to freeze state into cv_snapshot
                from app.services.cv_version_service import CVVersionService
                cv_service = CVVersionService(self.repo.session)
                cv = await cv_service.get(cv_vid, user_id)
                if cv:
                    cv_snapshot = {
                        "cv_id": str(cv["id"]),
                        "name": cv["name"],
                        "focus": cv["focus"],
                        "skills": cv["skills"],
                        "ats_score": cv["ats_score"],
                        "content": cv.get("parsed_content", "")
                    }
                    doc["cv_snapshot"] = cv_snapshot
            except Exception:
                pass

        # ── Determine Application Channel (Website vs Email) ──
        rec_email = (doc.get("recruiter_email") or (existing_app.recruiter_email if existing_app else "") or "").strip()
        apply_m = doc.get("apply_method") or (getattr(existing_app, "apply_method", None) if existing_app else None) or ("email" if rec_email else "website")
        is_email_dispatch = (apply_m == "email") and bool(rec_email) and ("@" in rec_email)

        app_letter_text = doc.pop("app_letter_text", None) or doc.get("notes") or ""
        app_letter_snapshot = None
        if app_letter_text:
            app_letter_snapshot = {
                "version_name": f"Formal Job Application Letter ({comp_name})",
                "content": app_letter_text,
                "role_title": role_title,
                "company_name": comp_name,
                "created_at": datetime.now(timezone.utc).isoformat()
            }

        if existing_app:
            # Deadline HAS NOT PASSED -> Update existing application with re-uploaded docs & letter!
            update_data = {
                "date_applied": datetime.now(timezone.utc).date(),
                "stage": doc.get("stage", "Applied"),
                "apply_method": apply_m,
            }
            if rec_email:
                update_data["recruiter_email"] = rec_email
            if "notes" in doc and doc["notes"]:
                update_data["notes"] = doc["notes"]
            if "cv_version_id" in doc and doc["cv_version_id"]:
                update_data["cv_version_id"] = doc["cv_version_id"]
            if cv_snapshot:
                update_data["cv_snapshot"] = cv_snapshot
            if app_letter_snapshot:
                update_data["app_letter_snapshot"] = app_letter_snapshot
            if "ats_score" in doc:
                update_data["ats_score"] = doc["ats_score"]

            target_app = await self.repo.update(existing_app.id, user_id, update_data)
        else:
            if app_letter_snapshot:
                doc["app_letter_snapshot"] = app_letter_snapshot
            doc["apply_method"] = apply_m
            target_app = await self.repo.create(doc)

        # Fetch user profile info for email generation
        applicant_info = None
        try:
            from app.models.sqlalchemy_models import User
            from sqlalchemy import select
            user_res = await self.repo.session.execute(select(User).where(User.id == user_id))
            user_obj = user_res.scalars().first()
            if user_obj:
                full_name = f"{user_obj.first_name or ''} {user_obj.last_name or ''}".strip()
                applicant_info = {
                    "name": full_name or "Dennis K",
                    "email": user_obj.email or "",
                    "phone": getattr(user_obj, "phone", "") or "",
                    "location": getattr(user_obj, "location", "") or "Nairobi, Kenya"
                }
        except Exception:
            pass

        email_result = None
        if is_email_dispatch:
            try:
                from app.services.email_service import EmailService
                email_svc = EmailService(self.repo.session)
                
                curr_cv_snap = cv_snapshot or getattr(target_app, "cv_snapshot", None)
                curr_app_snap = getattr(target_app, "app_letter_snapshot", None)
                curr_notes = doc.get("notes") or getattr(target_app, "notes", "") or ""

                email_result = await email_svc.send_application_email(
                    user_id=user_id,
                    recruiter_email=rec_email,
                    company_name=target_app.company_name,
                    role_title=target_app.role,
                    cover_letter=curr_notes,
                    cv_snapshot=curr_cv_snap,
                    app_letter_snapshot=curr_app_snap,
                    app_letter_text=app_letter_text or curr_notes,
                    application_id=target_app.id,
                    applicant_info=applicant_info,
                )
            except Exception as exc:
                print(f"Error recording application email dispatch: {exc}")
                email_result = {"email_sent": False, "smtp_error": str(exc)}

        try:
            from app.services.notification_service import NotificationService
            from app.schemas.notification import NotificationCreate
            notif_service = NotificationService(self.repo.session)
            
            if is_email_dispatch and email_result and email_result.get("email_sent"):
                notif_title = "Email Application Dispatched! 📧"
                notif_msg = f"Dispatched official application for {target_app.role} at {target_app.company_name} to recruiter with attached PDF resume & cover letter!"
            elif is_email_dispatch:
                notif_title = "Application Logged 📧"
                notif_msg = f"Application for {target_app.role} at {target_app.company_name} was saved to outbox log: {email_result.get('smtp_error') if email_result else 'Outbound log created.'}"
            else:
                notif_title = "Applied via Website Portal! 🌐"
                notif_msg = f"Logged application for {target_app.role} at {target_app.company_name} via company career website."

            await notif_service.create(user_id, NotificationCreate(
                title=notif_title,
                message=notif_msg,
                type="application",
                link="/applications"
            ))
        except Exception:
            pass

        res = _serialize(target_app)
        if email_result:
            res["email_sent"] = email_result.get("email_sent", False)
            if email_result.get("smtp_error"):
                res["smtp_error"] = email_result.get("smtp_error")
        return res

    async def get(self, app_id: int, user_id: int) -> dict | None:
        application = await self.repo.get(app_id, user_id)
        return _serialize(application) if application else None

    async def list(self, user_id: int, stage: str | None, skip: int, limit: int) -> list[dict]:
        applications = await self.repo.list_for_user(user_id, stage, skip, limit)

        # ── Automated Lifecycle Transitions ──
        # 1. Auto-move applied applications > 14 days without recruiter update to "Unresponded"
        # 2. Auto-move applications whose source job listing is expired/closed to "Job Closed"
        from datetime import date, timezone
        now_date = datetime.now(timezone.utc).date()
        modified = False

        for app in applications:
            if app.stage == "Applied" and app.date_applied:
                days_elapsed = (now_date - app.date_applied).days
                if days_elapsed >= 14:
                    app.stage = "Unresponded"
                    modified = True

            source_jid = getattr(app, "source_job_id", None)
            if source_jid and app.stage not in ["Offer", "Accepted", "Rejected", "Job Closed"]:
                try:
                    from app.models.sqlalchemy_models import Job
                    from sqlalchemy import select
                    job_res = await self.repo.session.execute(select(Job).where(Job.id == int(source_jid)))
                    linked_job = job_res.scalars().first()
                    if linked_job and (linked_job.is_expired or (linked_job.deadline and linked_job.deadline < now_date)):
                        app.stage = "Job Closed"
                        if not app.notes or "Job listing closed" not in app.notes:
                            note_text = app.notes or ""
                            app.notes = f"{note_text}\n\n[Automated System Update]: Job listing closed or filled by employer."
                        modified = True
                except Exception:
                    pass

        if modified:
            try:
                await self.repo.session.commit()
            except Exception:
                pass

        return [_serialize(a) for a in applications]

    async def update(self, app_id: int, user_id: int, payload: ApplicationUpdate) -> dict | None:
        patch = payload.model_dump(exclude_none=True)
        if "stage" in patch and hasattr(patch["stage"], "value"):
            patch["stage"] = patch["stage"].value
        if "company_id" in patch and patch["company_id"] is not None:
            try:
                patch["company_id"] = int(patch["company_id"])
            except ValueError:
                pass
        if "cv_version_id" in patch and patch["cv_version_id"] is not None:
            try:
                cv_vid = int(patch["cv_version_id"])
                patch["cv_version_id"] = cv_vid
                from app.services.cv_version_service import CVVersionService
                cv_service = CVVersionService(self.repo.session)
                cv = await cv_service.get(cv_vid, user_id)
                if cv:
                    patch["cv_snapshot"] = {
                        "cv_id": str(cv["id"]),
                        "name": cv["name"],
                        "focus": cv["focus"],
                        "skills": cv["skills"],
                        "ats_score": cv["ats_score"],
                        "content": cv.get("parsed_content", "")
                    }
            except Exception:
                pass
        # ── Handle app_letter_text → app_letter_snapshot ──
        app_letter_text_upd = patch.pop("app_letter_text", None)
        if app_letter_text_upd:
            patch["app_letter_snapshot"] = {
                "version_name": f"Updated Application Letter ({patch.get('company_name', '')})",
                "content": app_letter_text_upd,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        application = await self.repo.update(app_id, user_id, patch)
        return _serialize(application) if application else None

    async def delete(self, app_id: int, user_id: int) -> bool:
        return await self.repo.delete(app_id, user_id)

    async def analytics(self, user_id: int) -> ApplicationAnalytics:
        by_stage = await self.repo.aggregate_by_stage(user_id)
        totals = await self.repo.averages(user_id)

        total = int(totals.get("total", 0) or 0)
        interviews = sum(by_stage.get(s, 0) for s in INTERVIEW_STAGES)
        offers = by_stage.get("Offer", 0) + by_stage.get("Accepted", 0)
        responded = sum(by_stage.get(s, 0) for s in RESPONDED_STAGES)
        not_responded = max(0, total - responded)
        feedback_received = by_stage.get("Assessment", 0) + by_stage.get("Technical", 0) + by_stage.get("HR Interview", 0) + by_stage.get("Final Interview", 0) + by_stage.get("Offer", 0)

        return ApplicationAnalytics(
            total=total,
            interviews=interviews,
            offers=offers,
            responded=responded,
            not_responded=not_responded,
            feedback_received=feedback_received,
            response_rate=round(responded / total * 100) if total else 0,
            interview_rate=round(interviews / total * 100) if total else 0,
            offer_rate=round(offers / total * 100) if total else 0,
            avg_match=round(totals.get("avg_match", 0) or 0),
            avg_ats=round(totals.get("avg_ats", 0) or 0),
            by_stage=by_stage,
        )

    async def generate_followup_draft(self, app_id: int, user_id: int, tone: str = "polite") -> dict | None:
        """Generates a contextual follow-up email draft and an iCal (.ics) reminder for an application."""
        from datetime import date, timedelta
        application = await self.repo.get(app_id, user_id)
        if not application:
            return None

        comp_name = application.company_name
        role = application.role
        stage = application.stage
        date_applied = application.date_applied or datetime.now(timezone.utc).date()
        rec_email = application.recruiter_email or f"careers@{comp_name.lower().replace(' ', '')}.com"

        days_elapsed = (datetime.now(timezone.utc).date() - date_applied).days

        # Tone and stage based templates
        if stage in ["Technical", "HR Interview", "Final Interview"]:
            subject = f"Thank you & Following up: {role} Interview — {comp_name}"
            body = (
                f"Hi Hiring Team at {comp_name},\n\n"
                f"Thank you for taking the time to speak with me regarding the {role} position. "
                f"I really enjoyed learning more about your technical goals and vision.\n\n"
                f"I wanted to briefly reiterate my strong enthusiasm for joining {comp_name}. "
                f"Please let me know if there are any additional details or references I can provide.\n\n"
                f"Best regards,\nCandidate"
            )
        elif stage == "Offer":
            subject = f"Regarding {comp_name} — {role} Offer Details"
            body = (
                f"Dear {comp_name} Hiring Team,\n\n"
                f"Thank you very much for extending the offer for the {role} position! "
                f"I am thrilled about the opportunity to contribute to your team.\n\n"
                f"I am currently reviewing the offer details and would love to clarify a few parameters before finalizing. "
                f"Looking forward to speaking soon.\n\n"
                f"Warm regards,\nCandidate"
            )
        else:
            # Applied / Confirmed / Under Review / Unresponded
            subject = f"Following up on application: {role} — Candidate Status Inquiry"
            if tone == "confident":
                body = (
                    f"Hi {comp_name} Recruiting Team,\n\n"
                    f"I hope you are having a productive week.\n\n"
                    f"I am following up on my application for the {role} position submitted {days_elapsed} days ago. "
                    f"Given my background building high-throughput APIs and cloud solutions, I am confident I can bring immediate value to {comp_name}.\n\n"
                    f"I would welcome the opportunity for a brief conversation to discuss how my skill set aligns with your current priorities.\n\n"
                    f"Best regards,\nCandidate"
                )
            elif tone == "technical":
                body = (
                    f"Hello {comp_name} Engineering Team,\n\n"
                    f"I submitted an application for the {role} role {days_elapsed} days ago and wanted to reach out directly to restate my interest.\n\n"
                    f"With expertise in modern backend architecture, test automation, and database query optimization, I am very keen to contribute to {comp_name}'s engineering codebase.\n\n"
                    f"Could you provide an update on the hiring timeline for this opening?\n\n"
                    f"Sincerely,\nCandidate"
                )
            else:  # polite / default
                body = (
                    f"Dear {comp_name} Hiring Team,\n\n"
                    f"I hope this email finds you well.\n\n"
                    f"I submitted my application for the {role} position {days_elapsed} days ago and wanted to check in on the status of the review process.\n\n"
                    f"I remain very interested in the opportunity to join {comp_name}. Please let me know if you require any additional information from my side.\n\n"
                    f"Thank you for your time and consideration.\n\n"
                    f"Best regards,\nCandidate"
                )

        # Generate iCal (.ics) string for 1-click Google/Apple calendar reminder
        remind_date = datetime.now(timezone.utc).date() + timedelta(days=3)
        dt_start = remind_date.strftime("%Y%m%d")
        ics_content = (
            "BEGIN:VCALENDAR\r\n"
            "VERSION:2.0\r\n"
            "PRODID:-//Denno Career OS//Followup Reminder//EN\r\n"
            "BEGIN:VEVENT\r\n"
            f"SUMMARY:Follow up on {role} application at {comp_name}\r\n"
            f"DESCRIPTION:Send follow-up email to recruiter ({rec_email}). Stage: {stage}.\r\n"
            f"DTSTART;VALUE=DATE:{dt_start}\r\n"
            f"DTEND;VALUE=DATE:{dt_start}\r\n"
            "STATUS:CONFIRMED\r\n"
            "END:VEVENT\r\n"
            "END:VCALENDAR\r\n"
        )

        return {
            "application_id": app_id,
            "company_name": comp_name,
            "role": role,
            "stage": stage,
            "days_elapsed": days_elapsed,
            "recruiter_email": rec_email,
            "subject": subject,
            "body": body,
            "recommended_date": remind_date.isoformat(),
            "ics_content": ics_content,
        }

    async def get_pipeline_funnel_analytics(self, user_id: int) -> dict:
        """Returns visual conversion funnel metrics and drop-off bottleneck diagnostic insights."""
        by_stage = await self.repo.aggregate_by_stage(user_id)
        totals = await self.repo.averages(user_id)

        total_saved = by_stage.get("Saved", 0)
        total_applied = by_stage.get("Applied", 0) + by_stage.get("Confirmed", 0) + by_stage.get("Under Review", 0) + by_stage.get("Unresponded", 0)
        total_assessment = by_stage.get("Assessment", 0)
        total_interview = sum(by_stage.get(s, 0) for s in INTERVIEW_STAGES)
        total_offer = by_stage.get("Offer", 0) + by_stage.get("Accepted", 0)
        total_rejected = by_stage.get("Rejected", 0) + by_stage.get("Job Closed", 0)

        grand_total = int(totals.get("total", 0) or 0)
        applied_or_more = grand_total - total_saved

        # Conversion rates
        saved_to_applied_pct = round((applied_or_more / max(1, grand_total)) * 100)
        applied_to_interview_pct = round(((total_interview + total_assessment + total_offer) / max(1, applied_or_more)) * 100)
        interview_to_offer_pct = round((total_offer / max(1, total_interview + total_offer)) * 100)

        # Bottleneck Diagnostics
        bottleneck = "None"
        recommendation = "Maintain current application pacing and quality."

        if grand_total > 0:
            if applied_to_interview_pct < 15:
                bottleneck = "Applied ➔ Interview Drop-off"
                recommendation = "Low initial response rate. Use the Job-Specific CV Optimizer to increase ATS keyword matching score above 85%."
            elif interview_to_offer_pct < 20 and total_interview > 0:
                bottleneck = "Interview ➔ Offer Conversion Drop-off"
                recommendation = "High interview volume but low offer conversion. Utilize the Interview Prep Question Flashcards before technical rounds."
            elif saved_to_applied_pct < 50:
                bottleneck = "Saved ➔ Applied Stagnation"
                recommendation = "High volume of saved jobs unsubmitted. Use 1-click Application Letter Generator to speed up submission."

        funnel_steps = [
            {"step": "Saved", "count": grand_total, "pct": 100},
            {"step": "Applied", "count": applied_or_more, "pct": saved_to_applied_pct},
            {"step": "Interview / Tech", "count": total_interview + total_assessment + total_offer, "pct": applied_to_interview_pct},
            {"step": "Offer Extended", "count": total_offer, "pct": interview_to_offer_pct},
        ]

        return {
            "total_applications": grand_total,
            "funnel_steps": funnel_steps,
            "stage_breakdown": {
                "saved": total_saved,
                "applied": total_applied,
                "assessment": total_assessment,
                "interview": total_interview,
                "offer": total_offer,
                "rejected": total_rejected,
            },
            "conversion_rates": {
                "saved_to_applied": saved_to_applied_pct,
                "applied_to_interview": applied_to_interview_pct,
                "interview_to_offer": interview_to_offer_pct,
            },
            "diagnostics": {
                "primary_bottleneck": bottleneck,
                "recommendation": recommendation,
            },
        }

