"""add pending_verification to attendancestatus enum

Revision ID: a3b4c5d6e7f8
Revises: f7c1a9d3b2e4
Create Date: 2026-06-18

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text


revision: str = "a3b4c5d6e7f8"
down_revision: Union[str, None] = "f7c1a9d3b2e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        conn.execute(
            text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_enum e
                        JOIN pg_type t ON e.enumtypid = t.oid
                        WHERE t.typname = 'attendancestatus' AND e.enumlabel = 'pending_verification'
                    ) THEN
                        ALTER TYPE attendancestatus ADD VALUE 'pending_verification';
                    END IF;
                END
                $$;
            """)
        )


def downgrade() -> None:
    pass
