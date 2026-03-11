"""add performance indexes for attendance history and dashboard

Revision ID: abcd1234efgh
Revises: ed73eb3b8880
Create Date: 2026-02-20 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'abcd1234efgh'
down_revision: Union[str, None] = 'ed73eb3b8880'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # These indexes optimize common filters used in student dashboard and
    # attendance history endpoints without changing behaviour.
    with op.batch_alter_table('attendance_records') as batch_op:
        batch_op.create_index(
            'ix_attendance_records_status',
            ['status'],
            unique=False,
        )

    with op.batch_alter_table('attendance_sessions') as batch_op:
        batch_op.create_index(
            'ix_attendance_sessions_ends_at',
            ['ends_at'],
            unique=False,
        )


def downgrade() -> None:
    with op.batch_alter_table('attendance_sessions') as batch_op:
        batch_op.drop_index('ix_attendance_sessions_ends_at')

    with op.batch_alter_table('attendance_records') as batch_op:
        batch_op.drop_index('ix_attendance_records_status')

