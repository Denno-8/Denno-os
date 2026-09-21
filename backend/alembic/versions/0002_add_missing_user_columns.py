"""Add missing user profile columns (location, and all extended profile fields)

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0002'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add all extended profile columns that the ORM model expects but were
    # missing from the initial schema migration.
    # All statements use IF NOT EXISTS to be safe on existing databases.
    bind = op.get_bind()
    
    columns_to_add = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone character varying(20) DEFAULT ''",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS location character varying(255) DEFAULT ''",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS title character varying(255) DEFAULT ''",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS years_experience integer DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin character varying(255) DEFAULT ''",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS github character varying(255) DEFAULT ''",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS website character varying(255) DEFAULT ''",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS summary text DEFAULT ''",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS career_goal text DEFAULT ''",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS availability character varying(100) DEFAULT 'Immediately'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS notice_period character varying(100) DEFAULT '1 month'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS salary_min integer DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS salary_max integer DEFAULT 0",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS currency character varying(10) DEFAULT 'KES'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS open_to text[] DEFAULT '{}'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS theme character varying(20) DEFAULT 'light'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_enabled boolean DEFAULT false",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_public boolean DEFAULT false",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_list jsonb DEFAULT '[]'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS projects jsonb DEFAULT '[]'",
        """ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '{"jobs":true,"deadlines":true,"interviews":true,"emails":true,"learning":true,"weekly_report":true}'""",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()",
    ]
    
    for stmt in columns_to_add:
        try:
            bind.execute(sa.text(stmt))
        except Exception as e:
            # Column may already exist — safe to ignore
            print(f"Migration notice (0002): {e}")


def downgrade() -> None:
    # Dropping profile columns would be destructive — not implemented.
    pass
