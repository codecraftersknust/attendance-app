"""add absent to attendancestatus enum

Revision ID: f8a9b0c1d2e3
Revises: be2442e8c93f
Create Date: 2026-03-02

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text


revision: str = "f8a9b0c1d2e3"
down_revision: Union[str, None] = "be2442e8c93f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        # Add 'absent' to attendancestatus enum if not present
        conn.execute(
            text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_enum e
                        JOIN pg_type t ON e.enumtypid = t.oid
                        WHERE t.typname = 'attendancestatus' AND e.enumlabel = 'absent'
                    ) THEN
                        ALTER TYPE attendancestatus ADD VALUE 'absent';
                    END IF;
                END
                $$;
            """)
        )


def downgrade() -> None:
    # PostgreSQL does not support removing enum values easily.
    # Reverting would require recreating the type and column.
    pass
