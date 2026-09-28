"""
Email Intent Classifier Service
Classifies recruiter emails into intent categories and maps them to valid ApplicationStage enum values.
Covers: Offer, Interview (HR/Technical/Final), Assessment, Shortlisted, Responded,
Rejection, Confirmation, Follow-up Acknowledgment, and General Inquiry.
"""
import re
from datetime import datetime, timedelta, timezone


# ── Stage string → valid ApplicationStage enum value mapping ──────────────────
# All values here MUST match ApplicationStage enum in sqlalchemy_models.py exactly
STAGE_MAP = {
    "Offer":           "Offer",
    "Final Interview": "Final Interview",
    "HR Interview":    "HR Interview",
    "Technical":       "Technical",
    "Assessment":      "Assessment",
    "Shortlisted":     "Under Review",   # maps to Under Review (closest valid stage)
    "Responded":       "Confirmed",       # recruiter replied → Confirmed
    "Confirmed":       "Confirmed",
    "Under Review":    "Under Review",
    "Rejected":        "Rejected",
    "Applied":         "Applied",
}


class EmailClassifierService:
    @staticmethod
    def classify_email(subject: str, body: str, sender: str = "") -> dict:
        """
        Classifies an inbound recruiter email using priority-ordered hybrid keyword matching.
        Returns category, recommended_stage (valid DB enum value), extracted data, and action.

        Priority order (highest wins):
          1. Offer Letter
          2. Rejected / Unsuccessful
          3. Final Interview
          4. Technical / Coding Interview
          5. HR / General Interview Invitation
          6. Assessment / Coding Test
          7. Shortlisted / Under Review
          8. Application Confirmed / Acknowledged
          9. General Recruiter Response (Responded)
         10. General Inquiry / Unknown
        """
        subj_clean = (subject or "").strip()
        body_clean = (body or "").strip()
        full_text = f"{subj_clean}\n{body_clean}".lower()

        extracted_data = {
            "interview_datetime": None,
            "meeting_link": None,
            "assessment_deadline": None,
            "offer_details": None,
            "rejection_reason": None,
            "summary": "",
            "confidence": "high",
        }

        # ── Extract meeting / video call links ────────────────────────────────
        for pat in [
            r'https?://[^\s>"]*meet\.google\.com/[a-z0-9\-]+',
            r'https?://[^\s>"]*zoom\.us/(?:j|meeting)/[0-9]+',
            r'https?://[^\s>"]*teams\.microsoft\.com/l/meetup-join/[^\s>"]*',
            r'https?://[^\s>"]*calendly\.com/[^\s>"]+',
            r'https?://[^\s>"]*webex\.com/[^\s>"]+',
            r'https?://[^\s>"]*whereby\.com/[^\s>"]+',
        ]:
            m = re.search(pat, body_clean, re.IGNORECASE)
            if m:
                extracted_data["meeting_link"] = m.group(0)
                break

        # ── Extract date / time mentions ──────────────────────────────────────
        date_pats = [
            r'(?:(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm))?',
            r'\d{1,2}/\d{1,2}/\d{2,4}(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm))?',
            r'tomorrow\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)',
            r'this\s+(?:monday|tuesday|wednesday|thursday|friday)\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)',
        ]
        for dp in date_pats:
            dm = re.search(dp, body_clean, re.IGNORECASE)
            if dm:
                extracted_data["interview_datetime"] = dm.group(0).strip()
                break

        # ── Priority 1: OFFER LETTER ──────────────────────────────────────────
        _offer_kw = [
            "pleased to offer", "offer of employment", "official job offer",
            "congratulations on your offer", "we are delighted to offer",
            "extend an offer", "job offer letter", "employment offer",
            "offer package", "start date", "annual salary of",
        ]
        if any(k in full_text for k in _offer_kw):
            return {
                "category": "Offer Received",
                "recommended_stage": STAGE_MAP["Offer"],
                "recommended_action": "Review the offer letter carefully — salary, benefits, and start date. Negotiate if needed.",
                "extracted_data": {**extracted_data, "summary": "Employer has extended a formal job offer."},
            }

        # ── Priority 2: REJECTION ─────────────────────────────────────────────
        _reject_kw = [
            "unfortunately", "regret to inform", "not successful", "not selected",
            "decided to move forward with other", "pursue other candidates",
            "will not be proceeding", "unsuccessful", "not moving forward",
            "position has been filled", "not a match", "not moving you forward",
            "won't be moving", "doesn't meet", "have decided not to",
            "we will not", "unable to proceed", "after careful consideration",
        ]
        if any(k in full_text for k in _reject_kw):
            return {
                "category": "Rejection Letter",
                "recommended_stage": STAGE_MAP["Rejected"],
                "recommended_action": "Request constructive feedback, update your profile, and continue the pipeline.",
                "extracted_data": {**extracted_data, "summary": "Application was not selected for this position."},
            }

        # ── Priority 3: FINAL / EXECUTIVE INTERVIEW ───────────────────────────
        _final_kw = [
            "final round", "final interview", "final stage", "panel interview",
            "executive interview", "cto interview", "vp interview",
            "director interview", "c-suite", "leadership interview", "board interview",
        ]
        if any(k in full_text for k in _final_kw):
            link_str = f" Link: {extracted_data['meeting_link']}" if extracted_data['meeting_link'] else ""
            date_str = f" Date: {extracted_data['interview_datetime']}" if extracted_data['interview_datetime'] else ""
            return {
                "category": "Final Interview",
                "recommended_stage": STAGE_MAP["Final Interview"],
                "recommended_action": "Prepare thoroughly for the final panel. Research company strategy and leadership.",
                "extracted_data": {**extracted_data, "summary": f"Final round interview invitation.{date_str}{link_str}"},
            }

        # ── Priority 4: TECHNICAL / CODING INTERVIEW ──────────────────────────
        _technical_kw = [
            "technical interview", "coding interview", "system design",
            "architecture discussion", "engineering interview", "live coding",
            "pair programming", "technical assessment call", "whiteboard",
            "algorithm", "data structures interview", "technical screen",
        ]
        if any(k in full_text for k in _technical_kw):
            link_str = f" Link: {extracted_data['meeting_link']}" if extracted_data['meeting_link'] else ""
            date_str = f" Date: {extracted_data['interview_datetime']}" if extracted_data['interview_datetime'] else ""
            return {
                "category": "Technical Interview",
                "recommended_stage": STAGE_MAP["Technical"],
                "recommended_action": "Revise DSA, system design, and be ready for live coding exercises.",
                "extracted_data": {**extracted_data, "summary": f"Technical interview invitation.{date_str}{link_str}"},
            }

        # ── Priority 5: HR / GENERAL INTERVIEW INVITATION ─────────────────────
        _interview_kw = [
            "interview", "schedule a call", "schedule a meeting", "invitation to talk",
            "meet the team", "phone screen", "introductory call", "initial call",
            "discussion with hiring", "speak with our team", "conversation with",
            "chat with", "we'd like to invite you", "we would like to invite you",
            "invite you for", "set up a time", "book a slot", "calendly",
        ]
        if any(k in full_text for k in _interview_kw):
            link_str = f" Link: {extracted_data['meeting_link']}" if extracted_data['meeting_link'] else ""
            date_str = f" Date: {extracted_data['interview_datetime']}" if extracted_data['interview_datetime'] else ""
            return {
                "category": "Interview Invitation",
                "recommended_stage": STAGE_MAP["HR Interview"],
                "recommended_action": "Confirm your interview slot and review the job description and company background.",
                "extracted_data": {**extracted_data, "summary": f"Recruiter requested an interview.{date_str}{link_str}"},
            }

        # ── Priority 6: ASSESSMENT / CODING TEST ──────────────────────────────
        _assessment_kw = [
            "assessment", "coding test", "hackerrank", "codility", "testgorilla",
            "take-home challenge", "technical exercise", "online test", "skills test",
            "aptitude test", "assignment", "task to complete", "complete the following",
            "coding challenge", "homework", "project task",
        ]
        if any(k in full_text for k in _assessment_kw):
            return {
                "category": "Assessment Required",
                "recommended_stage": STAGE_MAP["Assessment"],
                "recommended_action": "Complete the technical assessment carefully and submit before the deadline.",
                "extracted_data": {**extracted_data, "summary": "Candidate invited to complete a technical skills assessment."},
            }

        # ── Priority 7: SHORTLISTED / UNDER REVIEW ───────────────────────────
        _shortlist_kw = [
            "shortlisted", "short-listed", "shortlist", "selected for the next stage",
            "moved to the next round", "progressing", "advancing your application",
            "pleased to inform you that you have been selected", "impressed by your profile",
            "your profile stands out", "your application is being reviewed",
            "under consideration", "under review", "reviewing your application",
            "your cv has been reviewed", "your resume has been reviewed",
        ]
        if any(k in full_text for k in _shortlist_kw):
            return {
                "category": "Shortlisted",
                "recommended_stage": STAGE_MAP["Shortlisted"],
                "recommended_action": "Great progress! Prepare your elevator pitch and be ready for the next stage.",
                "extracted_data": {**extracted_data, "summary": "Application shortlisted and under active recruiter review."},
            }

        # ── Priority 8: APPLICATION CONFIRMED / ACKNOWLEDGED ─────────────────
        _confirm_kw = [
            "thank you for applying", "application received", "received your resume",
            "received your cv", "confirm receipt", "we have received your application",
            "your application has been received", "successfully applied",
            "application submitted", "thank you for your interest",
            "we have received your details",
        ]
        if any(k in full_text for k in _confirm_kw):
            return {
                "category": "Application Received",
                "recommended_stage": STAGE_MAP["Confirmed"],
                "recommended_action": "Application confirmed. Allow 3–7 business days for review, then follow up if no response.",
                "extracted_data": {**extracted_data, "summary": "Company confirmed receipt of job application."},
            }

        # ── Priority 9: GENERIC RECRUITER RESPONSE (RESPONDED) ───────────────
        # Any email from a recruiter that doesn't fit above = they responded
        _responded_kw = [
            "thank you for your email", "thank you for reaching out", "following up",
            "getting back to you", "responding to your", "in response to",
            "re:", "regarding your application", "your inquiry", "reaching out about",
            "we have reviewed", "your application for",
        ]
        if any(k in full_text for k in _responded_kw) or (
            sender and sender not in ("", "noreply@") and len(body_clean) > 50
        ):
            return {
                "category": "Recruiter Response",
                "recommended_stage": STAGE_MAP["Responded"],
                "recommended_action": "Recruiter has responded — review message and reply promptly.",
                "extracted_data": {**extracted_data,
                                    "summary": "Received a direct response from the recruiter.",
                                    "confidence": "medium"},
            }

        # ── Priority 10: FALLBACK ─────────────────────────────────────────────
        return {
            "category": "General Inquiry",
            "recommended_stage": None,
            "recommended_action": "Review recruiter email content and respond if needed.",
            "extracted_data": {**extracted_data,
                                "summary": "Received a message related to your job application.",
                                "confidence": "low"},
        }

