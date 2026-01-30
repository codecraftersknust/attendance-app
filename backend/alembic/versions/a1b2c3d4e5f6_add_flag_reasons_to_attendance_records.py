"""add flag_reasons to attendance_records

Revision ID: a1b2c3d4e5f6
Revises: 4fcdbb8c93d1
Create Date: 2025-01-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "4fcdbb8c93d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("attendance_records", sa.Column("flag_reasons", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("attendance_records", "flag_reasons")
