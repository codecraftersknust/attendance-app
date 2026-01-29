"""add courses and verification_logs

Revision ID: ed73eb3b8880
Revises: ca0a3d693094
Create Date: 2025-10-06 15:03:19.435050

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ed73eb3b8880'
down_revision: Union[str, None] = 'ca0a3d693094'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create new tables if not present
    op.create_table(
        'courses',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('code', sa.String(length=32), nullable=False, unique=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'verification_logs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True),
        sa.Column('session_id', sa.Integer(), sa.ForeignKey('attendance_sessions.id', ondelete='CASCADE'), index=True),
        sa.Column('verified', sa.Boolean(), default=False),
        sa.Column('distance', sa.Float(), nullable=True),
        sa.Column('threshold', sa.Float(), nullable=True),
        sa.Column('model', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )

    # Use batch mode for SQLite compatibility when altering existing table
    with op.batch_alter_table('attendance_sessions') as batch_op:
        batch_op.add_column(sa.Column('course_id', sa.Integer(), nullable=True))
        # Ensure idempotency for repeated attempts
        op.execute('DROP INDEX IF EXISTS ix_attendance_sessions_course_id')
        batch_op.create_index('ix_attendance_sessions_course_id', ['course_id'], unique=False)
        # Note: SQLite cannot add FK constraints without table rebuild; batch_op will handle copy/recreate
        batch_op.create_foreign_key('fk_attendance_sessions_course_id_courses', 'courses', ['course_id'], ['id'])


def downgrade() -> None:
    with op.batch_alter_table('attendance_sessions') as batch_op:
        batch_op.drop_constraint('fk_attendance_sessions_course_id_courses', type_='foreignkey')
        batch_op.drop_index('ix_attendance_sessions_course_id')
        batch_op.drop_column('course_id')

    op.drop_table('verification_logs')
    op.drop_table('courses')
