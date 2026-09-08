# Production Deployment Guide — Denno Career OS

This guide provides step-by-step instructions for deploying **Denno Career OS** to production using Docker Compose, Nginx, PostgreSQL, Redis, FastAPI, and React.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [1. Environment Configuration](#1-environment-configuration)
- [2. Production Security Checklist](#2-production-security-checklist)
- [3. Deployment via Docker Compose](#3-deployment-via-docker-compose)
- [4. Data Seeding & Admin Promotion](#4-data-seeding--admin-promotion)
- [5. SSL/TLS Termination (Certbot / Let's Encrypt)](#5-ssltls-termination-certbot--lets-encrypt)
- [6. Alternative Cloud Hosting (Render / Railway / Coolify)](#6-alternative-cloud-hosting-render--railway--coolify)
- [7. Database Backup & Disaster Recovery](#7-database-backup--disaster-recovery)
- [8. Monitoring & Maintenance](#8-monitoring--maintenance)

---

## System Architecture

```
[ Client Browser ]
        │
        ▼ (Port 80 / 443 HTTPS)
┌─────────────────────────────────────────────────────────────┐
│ Nginx Container (Frontend SPA + Reverse Proxy)               │
└───────────────┬──────────────────────────────┬──────────────┘
                │ /api/*                       │ static /
                ▼                              ▼
┌──────────────────────────────┐    ┌─────────────────────────┐
│ FastAPI Backend (Uvicorn)    │    │ Compiled React Assets   │
└───────┬──────────────┬───────┘    └─────────────────────────┘
        │              │
        ▼              ▼
┌──────────────┐┌──────────────┐    ┌─────────────────────────┐
│ PostgreSQL 16││   Redis 7    │◀───│ Celery Worker & Beat    │
└──────────────┘└──────────────┘    └─────────────────────────┘
```

---

## Prerequisites

- **Host Server**: Linux VPS (Ubuntu 22.04 LTS or Debian 12 recommended) with at least **2 GB RAM** and **2 vCPUs**.
- **Software**:
  - Docker Engine 24.0+ (`docker --version`)
  - Docker Compose v2 (`docker compose version`)
  - Git (`git --version`)
- **Domain Name**: A valid domain pointed to your VPS public IP address (e.g. `denno.yourdomain.com`).

---

## 1. Environment Configuration

1. Clone the repository on your production server:
   ```bash
   git clone https://github.com/your-org/denno-project.git /opt/denno
   cd /opt/denno
   ```

2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Configure your production environment variables in `.env`:
   ```ini
   APP_NAME="Denno Career OS"
   APP_ENV=production
   DEBUG=false
   LOG_LEVEL=INFO

   # Database Credentials
   POSTGRES_USER=denno_admin
   POSTGRES_PASSWORD=SECURE_DATABASE_PASSWORD_HERE
   POSTGRES_DB=denno

   # Authentication Security (MUST generate strong random key)
   # Run: openssl rand -hex 32
   JWT_SECRET=YOUR_64_CHARACTER_RANDOM_HEX_STRING_HERE
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   REFRESH_TOKEN_EXPIRE_DAYS=30
   COOKIE_SECURE=true
   ALLOWED_HOSTS=denno.yourdomain.com

   # Bot & CAPTCHA Protection
   TURNSTILE_SECRET_KEY=0x4AAAAAA...   # Cloudflare Turnstile secret key

   # AI Integration
   ANTHROPIC_API_KEY=sk-ant-api03-...  # Claude API key for CV tailoring & chat

   # CORS & URLs
   FRONTEND_ORIGIN=https://denno.yourdomain.com
   VITE_API_URL=https://denno.yourdomain.com/api/v1
   ```

---

## 2. Production Security Checklist

Before booting the stack, verify the following security parameters:

- [x] **`APP_ENV`** is set to `production`.
- [x] **`DEBUG`** is set to `false`.
- [x] **`JWT_SECRET`** is replaced with a generated 256-bit key (`openssl rand -hex 32`).
- [x] **`COOKIE_SECURE`** is set to `true` (requires HTTPS).
- [x] **`POSTGRES_PASSWORD`** is replaced with a strong, non-default password.
- [x] **`ALLOWED_HOSTS`** contains your production domain, not `localhost`.
- [x] Secrets are **never** committed to version control (`.env` is ignored by `.gitignore`).

---

## 3. Deployment via Docker Compose

1. Build and start all services in detached mode:
   ```bash
   docker compose up -d --build
   ```

2. Check the container status:
   ```bash
   docker compose ps
   ```

   All 6 services should be in the `running` / `healthy` state:
   - `denno_postgres`
   - `denno_redis`
   - `denno_backend`
   - `denno_celery_worker`
   - `denno_celery_beat`
   - `denno_frontend`

3. Inspect backend logs:
   ```bash
   docker compose logs -f backend
   ```

---

## 4. Data Seeding & Admin Promotion

1. Run database migrations & initial seed scripts inside the running backend container:
   ```bash
   docker compose exec backend python scripts/seed_companies.py
   docker compose exec backend python scripts/seed_jobs.py
   docker compose exec backend python scripts/seed_job_sources.py
   ```

2. Register your user account in the frontend UI (`https://denno.yourdomain.com/register`).

3. Grant your account administrative privileges:
   ```bash
   docker compose exec backend python scripts/promote_admin.py admin@yourdomain.com
   ```

---

## 5. SSL/TLS Termination (Certbot / Let's Encrypt)

To secure traffic with HTTPS using Certbot on your host machine:

1. Install Certbot:
   ```bash
   sudo apt update
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. Obtain SSL certificate:
   ```bash
   sudo certbot --nginx -d denno.yourdomain.com
   ```

3. Ensure automatic certificate renewal:
   ```bash
   sudo systemctl status certbot.timer
   ```

---

## 6. Alternative Cloud Hosting (Render / Railway / Coolify)

### Deploying to Railway / Render
1. **Database**: Provision a managed PostgreSQL instance and Redis instance.
2. **Backend**:
   - Set Build Command: `pip install -r backend/requirements.txt`
   - Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables matching `.env.example`.
3. **Frontend**:
   - Set Build Command: `cd frontend && npm install && npm run build`
   - Set Publish Directory: `frontend/dist`
   - Set `VITE_API_URL` to your production backend domain.

---

## 7. Database Backup & Disaster Recovery

### Automated PostgreSQL Backup
Create a daily backup cron job on your host server:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2:00 AM
0 2 * * * docker exec denno_postgres pg_dump -U denno_admin denno | gzip > /var/backups/denno_$(date +\%F).sql.gz
```

### Database Restore Procedure
To restore from a compressed backup file:

```bash
gunzip -c /var/backups/denno_2026-09-08.sql.gz | docker exec -i denno_postgres psql -U denno_admin -d denno
```

---

## 8. Monitoring & Maintenance

### Checking Service Health
- **API Health Check**: `curl -f https://denno.yourdomain.com/health`
- **Readiness Check**: `curl -f https://denno.yourdomain.com/health/ready`

### Viewing Live Logs
```bash
# Tail all container logs
docker compose logs -f --tail=100

# View background worker logs
docker compose logs -f celery_worker
```

### Updating the Application
To pull updates and deploy a zero-downtime release:

```bash
git pull origin main
docker compose up -d --build --remove-orphans
```
