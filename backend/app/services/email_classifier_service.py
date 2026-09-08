"""
AI Email Intent Classifier Service
Classifies recruiter emails into intent categories (Interview Invite, Assessment, Offer, Rejection, Confirmation)
and extracts structured dates, meeting links, and stage recommendations.
"""
import re
from datetime import datetime, timedelta, timezone


class EmailClassifierService:
    @staticmethod
    def classify_email(subject: str, body: str, sender: str = "") -> dict:
        """
        Classifies an inbound recruiter email using hybrid NLP rule matching and pattern extraction.
        Returns category, recommended stage update, extracted meeting/interview info, and action summary.
        """
        subj_clean = (subject or "").strip()
        body_clean = (body or "").strip()
        full_text = f"{subj_clean}\n{body_clean}".lower()

        # Default classification
        category = "Application Received"
        recommended_stage = None
        recommended_action = "Review recruiter message."
        extracted_data = {
            "interview_datetime": None,
            "meeting_link": None,
            "assessment_deadline": None,
            "offer_details": None,
            "rejection_reason": None,
            "summary": ""
        }

        # Extract meeting links (Zoom, Google Meet, Teams, Webex, Calendly)
        link_patterns = [
            r'https?://[^\s>"]*meet\.google\.com/[a-z0-9\-]+',
            r'https?://[^\s>"]*zoom\.us/j/[0-9]+',
            r'https?://[^\s>"]*teams\.microsoft\.com/[^\s>"]*',
            r'https?://[^\s>"]*calendly\.com/[^\s>"]*',
            r'https?://[^\s>"]*webex\.com/[^\s>"]*'
        ]
        for pat in link_patterns:
            match = re.search(pat, body_clean, re.IGNORECASE)
            if match:
                extracted_data["meeting_link"] = match.group(0)
                break

        # Extract date/time hints (e.g. "Tomorrow at 3pm", "Monday, Sept 15 at 10:00 AM", etc.)
        date_pattern = r'(?:\b(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,\s*)?\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:\s*at\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?'
        date_match = re.search(date_pattern, body_clean, re.IGNORECASE)
        if date_match:
            extracted_data["interview_datetime"] = date_match.group(0)

        # ── 1. OFFER LETTER ──
        if any(k in full_text for k in ["pleased to offer", "official job offer", "offer of employment", "congratulations on your offer"]):
            category = "Offer Received"
            recommended_stage = "Offer"
            recommended_action = "Review job offer letter, salary package, and start date terms."
            extracted_data["summary"] = "The employer has extended an official job offer."

        # ── 2. INTERVIEW INVITATION ──
        elif any(k in full_text for k in [
            "interview", "schedule a call", "invitation to talk", "meet the team",
            "phone screen", "technical interview", "final round", "discussion with hiring manager"
        ]):
            if "technical" in full_text or "coding" in full_text or "architecture" in full_text:
                recommended_stage = "Technical"
                category = "Technical Interview"
            elif "final" in full_text or "executive" in full_text or "vp" in full_text:
                recommended_stage = "Final Interview"
                category = "Final Interview"
            else:
                recommended_stage = "HR Interview"
                category = "Interview Invitation"

            recommended_action = "Confirm interview slot and review interview preparation guide."
            link_str = f" Link: {extracted_data['meeting_link']}" if extracted_data['meeting_link'] else ""
            date_str = f" Date: {extracted_data['interview_datetime']}" if extracted_data['interview_datetime'] else ""
            extracted_data["summary"] = f"Recruiter requested an interview.{date_str}{link_str}"

        # ── 3. ASSESSMENT / TEST REQUIRED ──
        elif any(k in full_text for k in [
            "assessment", "coding test", "hackerrank", "codility", "take-home challenge",
            "technical exercise", "online test"
        ]):
            category = "Assessment Required"
            recommended_stage = "Assessment"
            recommended_action = "Complete technical assessment exercise before the deadline."
            extracted_data["summary"] = "Candidate invited to complete a technical skills assessment."

        # ── 4. REJECTION ──
        elif any(k in full_text for k in [
            "unfortunately", "regret to inform", "decided to move forward with other",
            "not selected", "pursue other candidates", "will not be proceeding"
        ]):
            category = "Rejection Letter"
            recommended_stage = "Rejected"
            recommended_action = "Archive application and focus on active candidate pipeline."
            extracted_data["summary"] = "Application was not selected for this position."

        # ── 5. APPLICATION CONFIRMATION / ACKNOWLEDGMENT ──
        elif any(k in full_text for k in [
            "thank you for applying", "application received", "received your resume",
            "confirm receipt", "we have received your application"
        ]):
            category = "Application Received"
            recommended_stage = "Confirmed"
            recommended_action = "Wait for recruiter application review (typically 3-7 business days)."
            extracted_data["summary"] = "Company confirmed receipt of job application."

        else:
            category = "General Inquiry"
            recommended_action = "Review recruiter email content."
            extracted_data["summary"] = "Received recruiter message regarding job application."

        return {
            "category": category,
            "recommended_stage": recommended_stage,
            "recommended_action": recommended_action,
            "extracted_data": extracted_data
        }
