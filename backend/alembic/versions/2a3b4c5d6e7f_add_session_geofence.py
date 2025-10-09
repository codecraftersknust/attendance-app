"""add geofence fields to attendance_sessions

Revision ID: 2a3b4c5d6e7f
Revises: 1f2a3b4c5d6e
Create Date: 2025-10-09
"""

from alembic import op
import sqlalchemy as sa


revision = '2a3b4c5d6e7f'
down_revision = '1f2a3b4c5d6e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('attendance_sessions', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('attendance_sessions', sa.Column('longitude', sa.Float(), nullable=True))
    op.add_column('attendance_sessions', sa.Column('geofence_radius_m', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('attendance_sessions', 'geofence_radius_m')
    op.drop_column('attendance_sessions', 'longitude')
    op.drop_column('attendance_sessions', 'latitude')


