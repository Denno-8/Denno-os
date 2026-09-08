"""
SQLAlchemy ORM models for PostgreSQL.
These replace the Pydantic Mongo models.
"""
from datetime import datetime, date
from typing import Optional, List
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, Integer, String, DateTime, Date, Boolean, Float, 
    ForeignKey, JSON, ARRAY, Enum, Text, Numeric, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.postgresql import Base

# Cross-database array column type: ARRAY(String) on PostgreSQL, JSON on SQLite
ArrayType = JSON().with_variant(ARRAY(String), "postgresql")



class ApplicationStage(str, PyEnum):
    """Enum for application workflow stages."""
    SAVED = "Saved"
    PREPARING = "Preparing"
    CV_OPTIMIZED = "CV Optimized"
    APPLIED = "Applied"
    CONFIRMED = "Confirmed"
    UNDER_REVIEW = "Under Review"
    UNRESPONDED = "Unresponded"
    ASSESSMENT = "Assessment"
    TECHNICAL = "Technical"
    HR_INTERVIEW = "HR Interview"
    FINAL_INTERVIEW = "Final Interview"
    OFFER = "Offer"
    ACCEPTED = "Accepted"
    JOB_CLOSED = "Job Closed"
    REJECTED = "Rejected"


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_role_is_active", "role", "is_active"),
    )

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    first_name = Column(String(100), default="")
    last_name = Column(String(100), default="")
    phone = Column(String(20), default="")
    location = Column(String(255), default="")
    title = Column(String(255), default="")
    years_experience = Column(Integer, default=0)
    linkedin = Column(String(255), default="")
    github = Column(String(255), default="")
    website = Column(String(255), default="")
    summary = Column(Text, default="")
    career_goal = Column(Text, default="")
    availability = Column(String(100), default="Immediately")
    notice_period = Column(String(100), default="1 month")
    salary_min = Column(Integer, default=0)
    salary_max = Column(Integer, default=0)
    currency = Column(String(10), default="KES")

    open_to = Column(ArrayType, default=[])
    skills = Column(ArrayType, default=[])
    education = Column(JSON, default=[])  # List of {degree, school, year, grade}
    experience_list = Column(JSON, default=[])  # List of {title, company, period, duties}
    projects = Column(JSON, default=[])  # List of {name, tech, description, url}
    certifications = Column(ArrayType, default=[])

    notifications = Column(JSON, default={"jobs": True, "deadlines": True, "interviews": True, "emails": True, "learning": True, "weekly_report": True})
    theme = Column(String(20), default="light")
    two_fa_enabled = Column(Boolean, default=False)
    profile_public = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True, nullable=False)
    role = Column(String(20), default="user")  # user | admin

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    cv_versions = relationship("CVVersion", back_populates="user", cascade="all, delete-orphan")
    calendar_events = relationship("CalendarEvent", back_populates="user", cascade="all, delete-orphan")
    emails = relationship("Email", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")
    recruiters = relationship("Recruiter", back_populates="user", cascade="all, delete-orphan")
    learning_courses = relationship("UserCourseProgress", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")


class Company(Base):
    __tablename__ = "companies"
    __table_args__ = (
        Index("ix_companies_sector_tier", "sector", "tier"),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, index=True)
    sector = Column(String(100), default="")
    location = Column(String(255), default="")
    ats_platform = Column(String(100), default="")
    career_url = Column(String(500), default="")
    contact_email = Column(String(255), default="")
    tech_stack = Column(ArrayType, default=[])
    open_roles_count = Column(Integer, default=0)
    tier = Column(Integer, default=1, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    jobs = relationship("Job", back_populates="company")


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        Index("ix_jobs_company_id", "company_id"),
        Index("ix_jobs_posted_at", "posted_at"),
        Index("ix_jobs_is_hot_is_expired", "is_hot", "is_expired"),
        Index("ix_jobs_mode_level", "mode", "level"),
    )

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    company_name = Column(String(255), nullable=False)

    title = Column(String(255), nullable=False)
    mode = Column(String(50), default="Remote")  # Remote | Hybrid | Onsite
    level = Column(String(50), default="Mid")  # Entry | Junior | Mid | Senior | Lead
    employment_type = Column(String(50), default="Full-time")

    salary_min = Column(Integer, default=0)
    salary_max = Column(Integer, default=0)
    currency = Column(String(10), default="KES")

    required_skills = Column(ArrayType, default=[])
    match_score = Column(Integer, default=75)
    ats_score = Column(Integer, default=70)

    posted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deadline = Column(Date, nullable=True)
    source_url = Column(String(500), default="")
    contact_email = Column(String(255), default="")
    is_hot = Column(Boolean, default=False)
    is_expired = Column(Boolean, default=False)
    description = Column(Text, default="")
    requirements = Column(ArrayType, default=[])  # parsed structured requirements

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    company = relationship("Company", back_populates="jobs")


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        Index("ix_applications_user_stage", "user_id", "stage"),
        Index("ix_applications_user_date_applied", "user_id", "date_applied"),
        Index("ix_applications_company_id", "company_id"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    company_name = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)

    stage = Column(Enum(ApplicationStage), default=ApplicationStage.SAVED)
    date_applied = Column(Date, nullable=False)

    cv_version_id = Column(Integer, ForeignKey("cv_versions.id"), nullable=True)
    cover_letter_id = Column(Integer, nullable=True)

    required_skills = Column(ArrayType, default=[])
    match_score = Column(Integer, default=0)
    ats_score = Column(Integer, default=0)

    salary_range = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    checklist = Column(JSON, default={})
    cv_snapshot = Column(JSON, nullable=True)  # frozen CV state at apply-time
    app_letter_snapshot = Column(JSON, nullable=True)  # frozen Application Letter PDF state at apply-time

    source_job_id = Column(String(255), nullable=True)
    source_url = Column(String(500), nullable=True)
    recruiter_email = Column(String(255), nullable=True)
    apply_method = Column(String(50), default="website")  # website | email

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="applications")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    body = Column("body", Text, default="")        # API-facing name (was 'content' in old schema)
    category = Column(String(100), default="Notes")
    tags = Column(ArrayType, default=[])

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="notes")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    label = Column(String(255), nullable=False, default="")
    category = Column(String(100), default="Applications")
    current = Column(Integer, default=0)
    target = Column(Integer, default=1)
    deadline = Column(Date, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="goals")


class CVVersion(Base):
    __tablename__ = "cv_versions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    focus = Column(String(255), default="")
    ats_score = Column(Integer, default=0)
    skills = Column(ArrayType, default=[])
    file_url = Column(String(500), nullable=True)
    parsed_content = Column(Text, nullable=True)  # extracted text from uploaded PDF/DOCX
    parsed_sections = Column(JSON, nullable=True)  # structured {summary, experience, education, skills}
    times_used = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="cv_versions")


class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    __table_args__ = (
        Index("ix_calendar_events_user_date", "user_id", "date"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    type = Column(String(50), default="Task")  # Interview | Deadline | Task | Learning | Reminder
    date = Column(Date, nullable=False)
    time = Column(String(50), default="")
    color = Column(String(50), default="blue")
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="calendar_events")


class Email(Base):
    __tablename__ = "emails"
    __table_args__ = (
        Index("ix_emails_user_read", "user_id", "read"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    from_name = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    category = Column(String(100), default="Application Received")
    body = Column(Text, default="")
    received_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    read = Column(Boolean, default=False)
    recommended_action = Column(Text, default="")
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    source = Column(String(100), default="manual")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="emails")


class Interview(Base):
    __tablename__ = "interviews"
    __table_args__ = (
        Index("ix_interviews_user_scheduled", "user_id", "scheduled_at"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    type = Column(String(50), default="Technical")
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(255), default="")
    behavioral_questions = Column(ArrayType, default=[])
    technical_questions = Column(ArrayType, default=[])
    status = Column(String(50), default="scheduled")
    prep_checklist = Column(JSON, default={})
    post_interview_notes = Column(Text, default="")
    outcome = Column(String(50), nullable=True)
    # Post-mortem structured reflection
    questions_asked = Column(JSON, default=[])   # [{question, answer_given, quality_rating}]
    what_went_well = Column(Text, default="")
    what_to_improve = Column(Text, default="")
    overall_confidence = Column(Integer, nullable=True)  # 1-10
    follow_up_actions = Column(ArrayType, default=[])
    post_mortem_done = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="interviews")


class Recruiter(Base):
    __tablename__ = "recruiters"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    company_name = Column(String(255), default="")
    email = Column(String(255), default="")
    linkedin = Column(String(255), default="")
    notes = Column(Text, default="")
    relationship_strength = Column(String(50), default="Warm")
    last_contacted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="recruiters")


class LearningCourse(Base):
    __tablename__ = "learning_courses"
    __table_args__ = (
        Index("ix_learning_courses_category_level", "category", "level"),
    )

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="")
    level = Column(String(50), default="Beginner")
    duration_minutes = Column(Integer, default=0)
    lesson_count = Column(Integer, default=1)
    url = Column(String(500), default="")
    linked_skill = Column(String(255), default="")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserCourseProgress(Base):
    __tablename__ = "user_course_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("learning_courses.id"), nullable=False)
    lessons_completed = Column(Integer, default=0)
    status = Column(String(50), default="not_started")  # not_started | in_progress | complete
    progress_percent = Column(Integer, default=0)
    certificate_url = Column(String(500), default="")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="learning_courses")
    course = relationship("LearningCourse")


class JobSource(Base):
    __tablename__ = "job_sources"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    company_name = Column("name", String(255), nullable=False)
    url = Column(String(500), default="")
    description = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    scrape_method = Column(String(100), default="manual")
    status = Column(String(50), default="recent")
    jobs_found = Column(Integer, default=0)
    last_checked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "read"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info | application | email | job_source | match
    link = Column(String(255), default="")
    read = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User")


class ChatSession(Base):
    """Persistent AI chatbot conversation sessions."""
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), default="New Chat")
    messages = Column(JSON, default=[])  # [{role, content, timestamp}]
    context_snapshot = Column(JSON, nullable=True)  # user context at session start

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="chat_sessions")

