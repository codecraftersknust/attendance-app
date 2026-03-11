"""merge heads

Revision ID: 105bcb2af9e1
Revises: 0acfdf11bc04, abcd1234efgh
Create Date: 2026-03-11 21:39:13.154753

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '105bcb2af9e1'
down_revision: Union[str, None] = ('0acfdf11bc04', 'abcd1234efgh')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
