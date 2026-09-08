from pydantic import BaseModel, Field

# Resources whose Create schema has a list[str] field — needed so CSV import
# knows to split "Python,AWS,Docker" into ["Python","AWS","Docker"] instead
# of passing a single malformed string straight to Pydantic.
LIST_FIELDS: dict[str, set[str]] = {
    "applications": {"required_skills"},
    "notes": {"tags"},
    "companies": {"tech_stack"},
    "jobs": {"required_skills"},
}

# Resources supported by /export and /import, and whether they're scoped to
# the requesting user (applications, notes, ...) or shared/public (companies, jobs).
USER_SCOPED_RESOURCES = {"applications", "notes", "goals", "recruiters", "cv", "interviews", "emails"}
PUBLIC_RESOURCES = {"companies", "jobs"}
ALL_RESOURCES = USER_SCOPED_RESOURCES | PUBLIC_RESOURCES


class ImportJSONRequest(BaseModel):
    records: list[dict] = Field(..., min_length=1)


class ImportResult(BaseModel):
    resource: str
    imported: int
    failed: int
    errors: list[str] = Field(default_factory=list)
