#!/bin/sh
# start.sh — Render production startup script
# Handles postgres:// → postgresql+asyncpg:// URL conversion required by asyncpg,
# runs Alembic migrations, then starts the Uvicorn server.
set -e

# Render provides DATABASE_URL as postgres://... but SQLAlchemy asyncpg needs postgresql+asyncpg://
export DATABASE_URL=$(echo "$DATABASE_URL" | sed 's|postgres://|postgresql+asyncpg://|')

echo "[start.sh] Running database migrations..."
alembic upgrade head

echo "[start.sh] Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
