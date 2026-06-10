"""add programme to attendance_sessions

Revision ID: e4a7c2b9f1d0
Revises: d1e2f3a4b5c6
Create Date: 2026-06-10

Sessions can be scoped to a single programme/class so that students from
other programmes taking the same course do not see (or mark) them.
NULL keeps the previous behaviour (open to all programmes).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e4a7c2b9f1d0"
down_revision: Union[str, None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "attendance_sessions",
        sa.Column("programme", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("attendance_sessions", "programme")
