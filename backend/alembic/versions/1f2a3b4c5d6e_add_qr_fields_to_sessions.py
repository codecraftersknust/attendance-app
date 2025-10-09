"""add qr fields to attendance_sessions

Revision ID: 1f2a3b4c5d6e
Revises: ed73eb3b8880
Create Date: 2025-10-09
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1f2a3b4c5d6e'
down_revision = 'ed73eb3b8880'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('attendance_sessions', sa.Column('qr_nonce', sa.String(length=64), nullable=True))
    op.add_column('attendance_sessions', sa.Column('qr_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.create_index('ix_attendance_sessions_qr_nonce', 'attendance_sessions', ['qr_nonce'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_attendance_sessions_qr_nonce', table_name='attendance_sessions')
    op.drop_column('attendance_sessions', 'qr_expires_at')
    op.drop_column('attendance_sessions', 'qr_nonce')


