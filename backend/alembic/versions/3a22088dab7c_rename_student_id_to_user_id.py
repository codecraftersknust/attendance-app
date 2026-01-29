"""rename_student_id_to_user_id

Revision ID: 3a22088dab7c
Revises: 6ff3c9e670df
Create Date: 2025-10-22 13:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a22088dab7c'
down_revision: Union[str, None] = '6ff3c9e670df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename student_id column to user_id using batch mode for SQLite compatibility
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('student_id', new_column_name='user_id')


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('user_id', new_column_name='student_id')