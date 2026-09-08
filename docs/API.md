# API Reference

> **Document type: API Reference.** This is the endpoint-by-endpoint
> contract — method, path, auth requirement, and purpose for all 68 routes.
> For *why* it's built this way, see [`ARCHITECTURE.md`](ARCHITECTURE.md).
> For request/response *shapes*, see each module's `schemas/*.py` or the
> live interactive docs at `http://localhost:8000/docs` once the backend is
> running (FastAPI generates that automatically from the same Pydantic
> models referenced here).

**Base URL:** `http://localhost:8000/api/v1`

**Auth header** (for every `USER`/`ADMIN` endpoint below):
```
Authorization: Bearer <access_token>
```

**Auth levels**

| Level | Meaning |
|---|---|
| 🌐 `PUBLIC` | No token required |
| 🔒 `USER` | Any authenticated user |
| 🛡️ `ADMIN` | Requires `role: admin` on the access token (see [`scripts/promote_admin.py`](../scripts/promote_admin.py)) |

## Table of Contents

- [Auth](#auth)
- [Applications](#applications)
- [Jobs](#jobs)
- [Companies](#companies)
- [Emails](#emails)
- [CV Manager](#cv-manager)
- [Learning](#learning)
- [Interviews](#interviews)
- [Calendar](#calendar)
- [Goals](#goals)
- [Knowledge Base (Notes)](#knowledge-base-notes)
- [Networking (Recruiters)](#networking-recruiters)
- [Source Monitor (Job Sources)](#source-monitor-job-sources)
- [Export / Import](#export--import)
- [AI](#ai)

---

## Auth
`/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `POST` | `/register` | 🌐 | Create an account, returns access + refresh tokens |
| `POST` | `/login` | 🌐 | Returns access + refresh tokens |
| `POST` | `/refresh` | 🌐 | Exchanges a refresh token for a new access token |
| `GET` | `/me` | 🔒 | Current user's profile |
| `POST` | `/logout` | 🔒 | Revokes the access token used to call it (Redis blacklist by `jti`) |
| `POST` | `/request-password-reset` | 🌐 | Always returns success (no email enumeration); logs a reset token — **does not send an email yet** |
| `POST` | `/reset-password` | 🌐 | Consumes a reset token, sets a new password |

## Applications
`/api/v1/applications`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🔒 | List (filter by `?stage=`, paginate with `?skip=&limit=`) |
| `GET` | `/analytics` | 🔒 | Response rate, interview rate, funnel counts |
| `GET` | `/{app_id}` | 🔒 | Single application |
| `POST` | `/` | 🔒 | Create |
| `PATCH` | `/{app_id}` | 🔒 | Partial update (stage, notes, checklist, ...) |
| `DELETE` | `/{app_id}` | 🔒 | Delete |

## Jobs
`/api/v1/jobs`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🌐 | Search/filter feed (`?q=&mode=&level=`) — **Redis-cached, 60s TTL** |
| `GET` | `/{job_id}` | 🌐 | Single job |
| `POST` | `/` | 🛡️ | Create (normally written by seed scripts/automation, not end users) |
| `POST` | `/{job_id}/apply` | 🔒 | **One-click apply** — creates a tracked Application from this Job |
| `PATCH` | `/{job_id}` | 🛡️ | Update |
| `DELETE` | `/{job_id}` | 🛡️ | Delete |

## Companies
`/api/v1/companies`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🌐 | Directory search (`?q=&sector=`) — **Redis-cached, 300s TTL** |
| `GET` | `/sectors` | 🌐 | Distinct sector list, for filter dropdowns |
| `GET` | `/{company_id}` | 🌐 | Single company |
| `POST` | `/` | 🛡️ | Create |
| `PATCH` | `/{company_id}` | 🛡️ | Update |
| `DELETE` | `/{company_id}` | 🛡️ | Delete |

## Emails
`/api/v1/emails`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🔒 | List (`?unread_only=true`) |
| `GET` | `/unread-count` | 🔒 | Badge count |
| `POST` | `/` | 🔒 | Add manually |
| `PATCH` | `/{email_id}` | 🔒 | Mark read, recategorize |
| `DELETE` | `/{email_id}` | 🔒 | Delete |

*Gmail auto-sync is not implemented — see [`ARCHITECTURE.md`](ARCHITECTURE.md) and the README Roadmap.*

## CV Manager
`/api/v1/cv`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🔒 | List versions |
| `POST` | `/` | 🔒 | Create a version |
| `PATCH` | `/{cv_id}` | 🔒 | Update (name, focus, skills, ATS score) |
| `POST` | `/{cv_id}/record-usage` | 🔒 | Bumps `times_used` / `last_used_at` — call when a CV is attached to a new Application |
| `DELETE` | `/{cv_id}` | 🔒 | Delete |

## Learning
`/api/v1/learning`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🔒 | Catalog merged with **your** progress (`?category=`) |
| `POST` | `/` | 🛡️ | Add a course to the shared catalog |
| `PATCH` | `/{course_id}` | 🛡️ | Edit a catalog entry |
| `DELETE` | `/{course_id}` | 🛡️ | Remove a course — **cascades**: deletes every user's progress record for it |
| `POST` | `/{course_id}/progress` | 🔒 | Update your own lesson-completion count |

## Interviews
`/api/v1/interviews`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🔒 | List (`?upcoming_only=true`) |
| `POST` | `/` | 🔒 | Schedule, tied to an `application_id` |
| `PATCH` | `/{interview_id}` | 🔒 | Update status, checklist, outcome, notes |
| `DELETE` | `/{interview_id}` | 🔒 | Cancel/delete |

## Calendar
`/api/v1/calendar`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🔒 | List (`?month=&year=`) |
| `POST` | `/` | 🔒 | Create an event |
| `PATCH` | `/{event_id}` | 🔒 | Update |
| `DELETE` | `/{event_id}` | 🔒 | Delete |

## Goals
`/api/v1/goals`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🔒 | List |
| `POST` | `/` | 🔒 | Create |
| `PATCH` | `/{goal_id}` | 🔒 | Update label/category/target/deadline |
| `POST` | `/{goal_id}/increment` | 🔒 | `{"delta": n}` — powers the +/− buttons, clamped to `[0, target]` |
| `DELETE` | `/{goal_id}` | 🔒 | Delete |

## Knowledge Base (Notes)
`/api/v1/notes`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🔒 | List/search (`?category=&q=`, `q` uses Mongo `$text` search) |
| `GET` | `/categories` | 🔒 | Distinct categories you've used |
| `POST` | `/` | 🔒 | Create |
| `PATCH` | `/{note_id}` | 🔒 | Update |
| `DELETE` | `/{note_id}` | 🔒 | Delete |

## Networking (Recruiters)
`/api/v1/recruiters`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🔒 | List (`?strength=Hot\|Warm\|Cold\|New`) |
| `POST` | `/` | 🔒 | Add a contact |
| `PATCH` | `/{recruiter_id}` | 🔒 | Update (commonly: relationship strength) |
| `DELETE` | `/{recruiter_id}` | 🔒 | Delete |

## Source Monitor (Job Sources)
`/api/v1/job-sources`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🌐 | List (`?status=verified\|recent\|expired\|archived`) |
| `POST` | `/` | 🛡️ | Register a new source |
| `POST` | `/{source_id}/verify` | 🔒 | Re-check a source — **simulated, not real scraping yet** (see [`ARCHITECTURE.md`](ARCHITECTURE.md)) |
| `DELETE` | `/{source_id}` | 🛡️ | Remove a source |

## Export / Import
No prefix — mounted directly under `/api/v1`.

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `GET` | `/export/{resource}?format=json\|csv` | 🔒 | Real file download via `Content-Disposition: attachment` |
| `POST` | `/import/{resource}/json` | 🔒 | Body: `{"records": [...]}` |
| `POST` | `/import/{resource}/csv` | 🔒 | `multipart/form-data` file upload |

**Supported `{resource}` values:** `applications`, `notes`, `goals`,
`recruiters`, `cv`, `interviews`, `emails` (user-scoped) · `companies`,
`jobs` (shared/public — importing these two specifically requires
`role: admin`, checked explicitly inside the import handler since it
bypasses the per-resource route where that guard normally lives).

Both import endpoints return an `ImportResult`:
```json
{
  "resource": "applications",
  "imported": 8,
  "failed": 1,
  "errors": ["row 3: field required (field: ('salary_range',))"]
}
```
A bad row never fails the whole batch — every row is validated and
attempted independently.

## AI
`/api/v1/ai`

| Method | Path | Auth | Description |
|---|---|:---:|---|
| `POST` | `/cover-letter` | 🔒 | `{job_title, company, tone, job_description?}` → generated letter |
| `POST` | `/denno1` | 🔒 | `{messages: [...]}` → chat reply |

Both proxy to the Anthropic API server-side — `ANTHROPIC_API_KEY` never
reaches the browser. Consumed by the frontend's Cover Letter Generator
page and the floating Denno1 chat widget (mounted globally once logged in).
