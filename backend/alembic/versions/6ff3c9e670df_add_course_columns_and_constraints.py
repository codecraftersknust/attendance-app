"""add_course_columns_and_constraints

Revision ID: 6ff3c9e670df
Revises: d6794ae76994
Create Date: 2025-10-22 13:32:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6ff3c9e670df'
down_revision: Union[str, None] = 'd6794ae76994'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing columns to courses table using batch mode for SQLite compatibility
    with op.batch_alter_table('courses') as batch_op:
        batch_op.add_column(sa.Column('description', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('semester', sa.String(length=20), nullable=False))
        batch_op.add_column(sa.Column('lecturer_id', sa.Integer(), nullable=False))
        batch_op.add_column(sa.Column('is_active', sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False))
        
        # Create foreign key constraint
        batch_op.create_foreign_key('fk_courses_lecturer_id', 'users', ['lecturer_id'], ['id'])
        
        # Create index on lecturer_id
        batch_op.create_index('ix_courses_lecturer_id', ['lecturer_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('courses') as batch_op:
        batch_op.drop_index('ix_courses_lecturer_id')
        batch_op.drop_constraint('fk_courses_lecturer_id', type_='foreignkey')
        batch_op.drop_column('updated_at')
        batch_op.drop_column('is_active')
        batch_op.drop_column('lecturer_id')
        batch_op.drop_column('semester')
        batch_op.drop_column('description')