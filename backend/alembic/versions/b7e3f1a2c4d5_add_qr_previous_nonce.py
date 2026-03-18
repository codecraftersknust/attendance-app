"""add qr_previous_nonce to attendance_sessions

Revision ID: b7e3f1a2c4d5
Revises: 105bcb2af9e1
Create Date: 2026-03-18
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7e3f1a2c4d5'
down_revision: Union[str, None] = '105bcb2af9e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('attendance_sessions', sa.Column('qr_previous_nonce', sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column('attendance_sessions', 'qr_previous_nonce')
