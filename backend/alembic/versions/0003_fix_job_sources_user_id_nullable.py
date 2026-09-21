"""Fix job_sources schema: make user_id + type nullable, add missing ORM columns

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-21 00:00:00.000000

The Alembic 0001 migration created job_sources with:
  - user_id  NOT NULL  (system aggregator never passes a user)
  - type     NOT NULL  (not in the ORM model, aggregator never passes it)
  - url      NOT NULL  (fine, aggregator does pass url)

This migration:
1. Drops NOT NULL from user_id and type (they're optional for system sources)
2. Adds DEFAULT values for columns that need them
3. Adds all columns the ORM JobSource model expects but that 0001 didn't create
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
        # ── Drop NOT NULL from columns the aggregator never supplies ────────────
        # Safe conditional: only runs if the column exists AND is NOT NULL
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

        """DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'job_sources'
                  AND column_name = 'type'
                  AND is_nullable = 'NO'
            ) THEN
                ALTER TABLE job_sources ALTER COLUMN type DROP NOT NULL;
                ALTER TABLE job_sources ALTER COLUMN type SET DEFAULT 'scrape';
            END IF;
        END $$""",

        # ── Add missing columns the ORM model expects ───────────────────────────
        "ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS company_id integer",
        "ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS description text DEFAULT ''",
        "ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS scrape_method character varying(100) DEFAULT 'manual'",
        "ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS status character varying(50) DEFAULT 'recent'",
        "ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS jobs_found integer DEFAULT 0",
        "ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS last_checked_at timestamp with time zone DEFAULT now()",
        "ALTER TABLE job_sources ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()",
    ]

    for stmt in fixes:
        try:
            bind.execute(sa.text(stmt))
        except Exception as e:
            print(f"Migration notice (0003): {e}")


def downgrade() -> None:
    # Re-adding NOT NULL constraints would be destructive if rows have NULLs
    pass
