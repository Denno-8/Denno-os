import asyncio
import imaplib
import email
from email.header import decode_header
from sqlalchemy import select, delete
from app.database import postgresql
from app.models.sqlalchemy_models import Application, Email
from app.core.config import settings

async def audit_email_feedback():
    await postgresql.init_db()
    async with postgresql.async_session_factory() as session:
        print("1. Purging bounce and mailer-daemon records from emails table...")
        
        # Purge fake/bounced email records
        res_emails = await session.execute(select(Email))
        db_emails = res_emails.scalars().all()
        
        purged_emails = 0
        valid_inbound_feedback = {} # application_id -> Email record
        
        for em in db_emails:
            combined = (em.subject + " " + em.from_name + " " + (em.body or "")).lower()
            
            # Check if bounce or delivery failure
            if any(b in combined for b in [
                "mailer-daemon", "address not found", "delivery status notification",
                "undeliverable", "failure notice", "postmaster@", "message not delivered"
            ]):
                await session.delete(em)
                purged_emails += 1
                continue
                
            # Check if outbound sent email
            if em.category == "Application Sent" or em.source == "smtp_sent" or "outbound" in em.from_name.lower():
                continue
                
            # If genuine inbound recruiter email linked to an application
            if em.application_id:
                valid_inbound_feedback[em.application_id] = em

        await session.commit()
        print(f"[OK] Purged {purged_emails} bounce/delivery failure email records!")

        print("\n2. Re-auditing all application stages against verified inbound recruiter feedback...")
        res_apps = await session.execute(select(Application))
        all_apps = res_apps.scalars().all()
        
        reset_count = 0
        confirmed_count = 0

        for app in all_apps:
            inbound_email = valid_inbound_feedback.get(app.id)
            
            if inbound_email:
                # Stage determined by real email feedback
                cat = inbound_email.category.lower() if inbound_email.category else ""
                subj = inbound_email.subject.lower()
                body = (inbound_email.body or "").lower()
                text = subj + " " + body
                
                if "interview" in cat or "interview" in text:
                    app.stage = "HR Interview" if "hr" in text else "Technical"
                    print(f"  • {app.role} at {app.company_name} -> {app.stage} (Verified Interview Email)")
                elif "assessment" in cat or "coding test" in text or "hackerrank" in text:
                    app.stage = "Assessment"
                    print(f"  • {app.role} at {app.company_name} -> Assessment (Verified Assessment Email)")
                elif "offer" in cat or "congratulations" in text:
                    app.stage = "Offer"
                    print(f"  • {app.role} at {app.company_name} -> Offer (Verified Offer Email)")
                elif "regret" in text or "rejected" in cat or "not selected" in text:
                    app.stage = "Rejected"
                    print(f"  • {app.role} at {app.company_name} -> Rejected (Verified Rejection Email)")
                else:
                    app.stage = "Confirmed"
                    confirmed_count += 1
                    print(f"  • {app.role} at {app.company_name} -> Confirmed (Verified Recruiter Receipt)")
            else:
                # No verified inbound recruiter email exists for this application
                if app.stage in ["Confirmed", "Under Review", "Assessment", "Technical", "HR Interview", "Final Interview", "Offer", "Rejected"]:
                    print(f"  • Resetting {app.role} at {app.company_name} (was: {app.stage} -> now: Applied [No recruiter feedback email yet])")
                    app.stage = "Applied"
                    reset_count += 1

        await session.commit()
        print(f"\n[OK] Audit Complete! Reset {reset_count} applications without recruiter feedback back to 'Applied'.")

if __name__ == "__main__":
    asyncio.run(audit_email_feedback())
