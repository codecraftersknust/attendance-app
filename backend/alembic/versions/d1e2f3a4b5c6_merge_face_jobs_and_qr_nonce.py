"""merge face_verification_jobs and qr_previous_nonce heads

Revision ID: d1e2f3a4b5c6
Revises: b7e3f1a2c4d5, c9d8e7f6a5b4
Create Date: 2026-06-04

"""
from typing import Sequence, Union

from alembic import op


revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, tuple[str, ...], None] = ("b7e3f1a2c4d5", "c9d8e7f6a5b4")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
