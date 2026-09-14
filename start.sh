#!/bin/sh
# start.sh — Render production startup script
# Handles postgres:// → postgresql+asyncpg:// URL conversion required by asyncpg,
# runs Alembic migrations, then starts the Uvicorn server.
set -e

# Render provides DATABASE_URL as postgres://... but SQLAlchemy asyncpg needs postgresql+asyncpg://
# Export immediately so ALL subsequent Python processes (alembic, uvicorn) see the patched URL.
export DATABASE_URL=$(echo "$DATABASE_URL" | sed 's|postgres://|postgresql+asyncpg://|g')

echo "[start.sh] DATABASE_URL scheme: $(echo $DATABASE_URL | cut -d: -f1)"
echo "[start.sh] Running database migrations..."

# alembic.ini lives inside backend/ which is mounted at /app
cd /app && alembic -c alembic.ini upgrade head

echo "[start.sh] Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
