# Architecture

> **Document type: Architecture Reference.** This describes *how the system
> is built* — components, data flow, and deployment. For *what the API
> does*, see [`API.md`](API.md). For *how data is shaped*, see
> [`../database/SCHEMA.md`](../database/SCHEMA.md). For setup instructions,
> see the [root README](../README.md).

## Table of Contents

- [1. Overview](#1-overview)
- [2. Layered Backend Design](#2-layered-backend-design)
- [3. System Diagram](#3-system-diagram)
- [4. Request Lifecycle: Authentication](#4-request-lifecycle-authentication)
- [5. Request Lifecycle: One-Click Apply](#5-request-lifecycle-one-click-apply)
- [6. Caching Strategy](#6-caching-strategy)
- [7. Background Jobs](#7-background-jobs)
- [8. Deployment Topology](#8-deployment-topology)
- [9. Design Decisions & Trade-offs](#9-design-decisions--trade-offs)

---

## 1. Overview

Denno is a layered monolith: one FastAPI process serving 13 resource
modules plus auth, backed by MongoDB, with Redis for caching/token
revocation/Celery brokering, and a React SPA frontend. It is not
microservices — every module lives in the same codebase and deploys as a
single process — but each module is internally layered so it *could* be split
out later without a rewrite.

## 2. Layered Backend Design

Every module (Applications, Jobs, Companies, ...) follows the same five-file
pattern, strictly one-directional:

```mermaid
flowchart LR
    ROUTE["api/&lt;module&gt;/routes.py<br/>HTTP concerns only"]
    SVC["services/&lt;module&gt;_service.py<br/>business logic, validation"]
    REPO["repositories/&lt;module&gt;_repository.py<br/>Motor queries only"]
    SCHEMA["schemas/&lt;module&gt;.py<br/>request/response shapes"]
    MODEL["models/&lt;module&gt;.py<br/>Mongo document shape"]

    ROUTE --> SVC
    SVC --> REPO
    ROUTE -.uses.-> SCHEMA
    REPO -.persists as.-> MODEL
```

| Layer | Owns | Never does |
|---|---|---|
| `routes.py` | HTTP status codes, auth dependency wiring, request/response models | Direct DB access, business rules |
| `service` | Validation, cross-module composition (e.g. `JobService` calling into `ApplicationService`), serialization | Raw Motor query syntax |
| `repository` | All `db[collection].find_one(...)` etc. | Business rules, HTTP concerns |
| `schema` | Pydantic models exposed over HTTP | Storage concerns |
| `model` | Pydantic model matching what's actually stored in Mongo | Wire-format concerns |

This is enforced, not just documented — `scripts/check_wiring.py` statically
verifies every `route → service` and `service → repository` call resolves
to a real method on the target class, and fails CI if it doesn't.

## 3. System Diagram

```mermaid
flowchart TB
    subgraph Client["Client"]
        FE["React SPA<br/>13 pages, TanStack Query"]
    end

    subgraph Backend["FastAPI Backend (single process)"]
        direction TB
        MW["CORS middleware"]
        AUTHR["/auth/*"]
        DOMAINR["12 domain route modules"]
        AIR["/ai/*  (Anthropic proxy)"]
        XFERR["/export/*, /import/*"]
    end

    MONGO[("MongoDB<br/>14 collections")]
    REDIS[("Redis<br/>cache + token blacklist + broker")]
    CELERY_W["Celery worker"]
    CELERY_B["Celery beat"]
    ANTHROPIC["Anthropic API"]

    FE -->|"HTTPS"| MW --> AUTHR & DOMAINR & AIR & XFERR
    AUTHR --> MONGO
    AUTHR -->|"revocation check"| REDIS
    DOMAINR --> MONGO
    DOMAINR -->|"cache jobs/companies lists"| REDIS
    AIR -->|"server-side only, key never sent to client"| ANTHROPIC
    XFERR --> MONGO

    CELERY_B -->|"cron schedule"| CELERY_W
    CELERY_W --> MONGO
    CELERY_W -.broker.-> REDIS
```

## 4. Request Lifecycle: Authentication

```mermaid
sequenceDiagram
    participant U as Browser
    participant A as /auth routes
    participant S as AuthService
    participant D as MongoDB
    participant R as Redis

    U->>A: POST /auth/login {email, password}
    A->>S: login(payload)
    S->>D: find user by email
    D-->>S: user document
    S->>S: verify_password(bcrypt)
    S->>S: create_access_token(role) + create_refresh_token()
    S-->>A: TokenResponse
    A-->>U: {access_token, refresh_token}

    Note over U: Every subsequent request
    U->>A: GET /applications (Bearer access_token)
    A->>A: decode JWT, check type == access
    A->>R: is_token_revoked(jti)?
    R-->>A: not revoked
    A-->>U: 200 OK

    Note over U: Logout
    U->>A: POST /auth/logout (Bearer access_token)
    A->>R: SET revoked_token:{jti} EX {ttl}
    R-->>A: ok
    A-->>U: 200 {"message": "Logged out"}
```

## 5. Request Lifecycle: One-Click Apply

This is the one genuinely cross-module flow in the codebase — `JobService`
composes `ApplicationService` directly rather than going through HTTP:

```mermaid
sequenceDiagram
    participant U as Browser
    participant JR as /jobs routes
    participant JS as JobService
    participant AS as ApplicationService
    participant D as MongoDB

    U->>JR: POST /jobs/{id}/apply
    JR->>JS: apply(job_id, user_id)
    JS->>JS: repo.get(job_id)
    JS->>JS: build ApplicationCreate from job fields<br/>(company_name, title, skills, salary formatting)
    JS->>AS: create(user_id, payload)
    AS->>D: insert_one(application doc)
    D-->>AS: inserted document
    AS-->>JS: serialized Application
    JS-->>JR: Application
    JR-->>U: 201 Created
```

## 6. Caching Strategy

| Endpoint | TTL | Invalidation |
|---|---|---|
| `GET /jobs` | 60s | SCAN + DELETE on any `POST`/`PATCH`/`DELETE /jobs` |
| `GET /companies` | 300s | SCAN + DELETE on any `POST`/`PATCH`/`DELETE /companies` |

Both cache reads/writes are wrapped in `try/except` — if Redis is
unreachable, the endpoint falls back to a live Mongo read rather than
failing the request. Cache keys are built from the full query-parameter
tuple (`q`, filters, pagination), so different search results never collide.

## 7. Background Jobs

| Task | Schedule | What it does |
|---|---|---|
| `app.tasks.job_sources.verify_all_sources` | Daily, 03:00 UTC | Re-checks every Job Source's status (currently simulated — see [API.md](API.md#job-sources)) |
| `app.tasks.reports.generate_weekly_reports` | Weekly, Monday 06:00 UTC | Computes application analytics per user (logs only — no email/persistence wired up yet) |

Each task opens its **own** short-lived Mongo connection rather than sharing
the FastAPI process's pool, since Celery workers are separate OS processes.

## 8. Deployment Topology

```mermaid
flowchart TB
    subgraph Services["Local services"]
        MONGO_C["MongoDB"]
        REDIS_C["Redis"]
        BACKEND_C["FastAPI backend"]
        WORKER_C["Celery worker"]
        BEAT_C["Celery beat"]
        FRONTEND_C["React/Vite frontend"]
    end

    BACKEND_C --> MONGO_C
    BACKEND_C --> REDIS_C
    WORKER_C --> MONGO_C
    WORKER_C --> REDIS_C
    BEAT_C --> REDIS_C
    FRONTEND_C -.->|"VITE_API_URL"| BACKEND_C
```

The app is expected to run with local MongoDB and Redis services plus the
backend, worker, beat, and frontend processes started separately.

## 9. Design Decisions & Trade-offs

| Decision | Why | Trade-off accepted |
|---|---|---|
| Motor (async) over PyMongo (sync) | FastAPI is async end-to-end; a sync driver would block the event loop | Slightly more ceremony per query (`await` everywhere) |
| Service-layer composition (`JobService` → `ApplicationService`) instead of HTTP-calling-itself | Avoids a service calling its own API over HTTP, which is slower and fragile | Services must be constructed with the same `db` handle — enforced by convention, checked by `check_wiring.py` |
| `jti`-based token revocation instead of a full session store | Stateless JWTs stay stateless for 99% of requests; only logout touches Redis | A stolen *refresh* token issued before rotation isn't independently revocable without extending this further |
| Denormalized `company_name` on `applications`/`jobs` | Read-heavy list views shouldn't need a `$lookup` on every render | Company renames require a backfill (not automated yet) |
| CSV/JSON export composes existing services, not raw Mongo dumps | Every export goes through the same Pydantic validation as a normal read | Slightly slower than a raw collection dump for very large exports (not a concern at current scale) |
