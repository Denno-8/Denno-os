from datetime import datetime
from pydantic import BaseModel, Field


class JobSourceCreate(BaseModel):
    company_id: str
    company_name: str
    url: str
    scrape_method: str = "manual"
    status: str = "recent"
    jobs_found: int = 0


class JobSourceOut(BaseModel):
    id: str
    company_id: str
    company_name: str
    url: str
    scrape_method: str
    status: str
    jobs_found: int
    last_checked_at: datetime
    created_at: datetime


class VerifyResult(BaseModel):
    id: str
    status: str
    jobs_found: int
    last_checked_at: datetime
