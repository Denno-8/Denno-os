# Denno Career OS — Security & Pre-Deployment Audit Report

**Audit Date**: September 12, 2026  
**Target Build**: Production Release v1.0  
**Stack**: FastAPI (Python 3.12), PostgreSQL 16, AsyncSQLAlchemy, Redis 7, React 18, TypeScript, Tailwind CSS, Vite

---

## Executive Summary

This document details the security architecture, threat mitigations, credential requirements, and pre-flight operational steps for deploying **Denno Career OS** to production.

---

## 1. Secrets & Credentials Checklist

The following environment variables **must** be populated with secure, non-default values in your production `.env` prior to launch:

| Variable | Requirement | Description / Action Required |
|---|---|---|
| `JWT_SECRET` | 256-bit cryptographically random key | Generate with `openssl rand -hex 32` |
| `POSTGRES_PASSWORD` | Strong non-default passphrase | Replace default database password |
| `APP_ENV` | String (`production`) | Enables production mode checks |
| `DEBUG` | Boolean (`false`) | Disables detailed FastAPI traceback responses |
| `COOKIE_SECURE` | Boolean (`true`) | Enforces `Secure` flag on `httpOnly` refresh cookies |
| `ALLOWED_HOSTS` | Whitelist string | Host header protection (e.g., `denno.app,api.denno.app`) |
| `FRONTEND_ORIGIN` | Whitelist URL | Strict CORS allowed origin (e.g., `https://denno.vercel.app`) |
| `TURNSTILE_SECRET_KEY` | Secret Key string | Cloudflare Turnstile bot verification secret key |
| `ANTHROPIC_API_KEY` | Secret Key string | Anthropic Claude API key for Cover Letter AI & Denno1 |
| `SENTRY_DSN` | Ingestion DSN | Sentry project DSN for runtime exception tracking |

---

## 2. Implemented Security Controls Audit

### 🔑 Authentication & Token Management
- **Argon2id Password Hashing**: Passwords are hashed using Argon2id (memory-hard, PHC winner). Automatic transparent upgrading converts legacy PBKDF2 hashes on the user's next login.
- **Dual-Token Storage Strategy**:
  - *Access Token*: Short-lived (60 min) held in client `sessionStorage`.
  - *Refresh Token*: Long-lived (30 days) stored in an **`httpOnly`**, **`SameSite=Lax`**, **`Secure`** cookie — immune to XSS theft.
- **Token Revocation (Logout)**: Every JWT carries a `jti` (unique token ID). Blacklisted instantly in Redis upon calling `/auth/logout`.
- **Password Reset Security**: Reset tokens are short-lived (15 min) and restricted to single-use.

### 🤖 Bot Protection & Rate Limiting
- **Cloudflare Turnstile**: Token verification enforced on `/register` and `/login` endpoints.
- **Brute-Force Lockout**: Automatically locks IP / account combinations after 5 consecutive failed login attempts for 15 minutes.
- **Rate Limiting**: Enforced via `slowapi` + Redis on API routes.

### 🌐 Network & HTTP Security Headers
- **Strict-Transport-Security (HSTS)**: `max-age=63072000; includeSubDomains; preload`
- **Clickjacking Protection**: `X-Frame-Options: DENY`
- **MIME Sniffing Shield**: `X-Content-Type-Options: nosniff`
- **Referrer Policy**: `strict-origin-when-cross-origin`

### 📂 Data & Object Storage Security
- **Private S3 / MinIO Storage**: Uploaded CVs and document binaries are stored in private buckets. Access is delivered via temporary **presigned URLs** or local fallback routes enforcing user ownership checks.
- **Parameterized SQL**: 100% ORM-parameterized queries via AsyncSQLAlchemy to prevent SQL injection.
- **Upload Restrictions**: Enforced 10 MB maximum file payload size limit at Nginx and FastAPI layers.

### 📊 Observability & Privacy
- **GDPR Compliance**: Sentry SDK initialized with `send_default_pii=False`.
- **Audit Trails**: Security-sensitive actions (password changes, role promotions) are written to audit logs without storing plain-text secrets.

---

## 3. Pre-Flight Operational Commands

Execute the following commands on your server once the containers are running:

```bash
# 1. Apply database migrations
docker compose exec backend alembic upgrade head

# 2. Seed initial system data
docker compose exec backend python scripts/seed_companies.py
docker compose exec backend python scripts/seed_jobs.py
docker compose exec backend python scripts/seed_job_sources.py

# 3. Promote primary administrator account
docker compose exec backend python scripts/promote_admin.py admin@yourdomain.com
```
