"""Fix job_sources schema: make user_id nullable, add missing columns

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-21 00:00:00.000000

The Alembic 0001 migration created job_sources with user_id NOT NULL,
but the ORM model and the daily job aggregator (real_job_fetcher.py)
never pass a user_id when creating system-level job source records.
This caused IntegrityError on every daily background job run.

job_sources are system-level records owned by the platform, not by
individual users, so user_id should be nullable.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0003'
down_revision: Union[str, None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    fixes = [
        # Safely drop NOT NULL from user_id only if the constraint exists
        # (fresh deployments via create_all won't have this constraint)
        """DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'job_sources'
                  AND column_name = 'user_id'
                  AND is_nullable = 'NO'
            ) THEN
                ALTER TABLE job_sources ALTER COLUMN user_id DROP NOT NULL;
            END IF;
        END $$""",
        # Add any missing columns that the ORM model expects
        "ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS description text DEFAULT ''",
        "ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS scrape_method character varying(100) DEFAULT 'manual'",
        "ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS status character varying(50) DEFAULT 'recent'",
        "ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS jobs_found integer DEFAULT 0",
        "ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS last_checked_at timestamp with time zone DEFAULT now()",
        "ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()",
        "ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS company_id integer",
    ]

    for stmt in fixes:
        try:
            bind.execute(sa.text(stmt))
        except Exception as e:
            print(f"Migration notice (0003): {e}")


def downgrade() -> None:
    # Re-adding NOT NULL would fail if any rows have NULL user_id, so downgrade is no-op
    pass
