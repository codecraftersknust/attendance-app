"""add canonical programmes table

Revision ID: f7c1a9d3b2e4
Revises: e4a7c2b9f1d0
Create Date: 2026-06-10

Creates a canonical ``programmes`` table and seeds it with the KNUST
engineering programmes plus any programme names already present in
``users`` and ``course_programmes`` (so existing data stays valid).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f7c1a9d3b2e4"
down_revision: Union[str, None] = "e4a7c2b9f1d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Mirrors web/lib/programmes.ts and mobile/lib/programmes.ts
SEED_PROGRAMMES = [
    "General",
    "Agricultural Engineering",
    "Aerospace Engineering",
    "Biomedical Engineering",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Engineering",
    "Electrical and Electronics Engineering",
    "Geological Engineering",
    "Geomatic Engineering",
    "Materials Engineering",
    "Mechanical Engineering",
    "Metallurgical Engineering",
    "Petrochemical Engineering",
    "Petroleum Engineering",
    "Telecommunications Engineering",
]


def upgrade() -> None:
    op.create_table(
        "programmes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.UniqueConstraint("name", name="uq_programmes_name"),
    )
    op.create_index("ix_programmes_name", "programmes", ["name"])

    programmes = sa.table("programmes", sa.column("name", sa.String))
    op.bulk_insert(programmes, [{"name": p} for p in SEED_PROGRAMMES])

    # Preserve any programme names already used in existing data
    conn = op.get_bind()
    conn.execute(sa.text(
        """
        INSERT INTO programmes (name)
        SELECT DISTINCT programme FROM course_programmes
        WHERE programme IS NOT NULL AND TRIM(programme) != ''
          AND programme NOT IN (SELECT name FROM programmes)
        """
    ))
    conn.execute(sa.text(
        """
        INSERT INTO programmes (name)
        SELECT DISTINCT programme FROM users
        WHERE programme IS NOT NULL AND TRIM(programme) != ''
          AND programme NOT IN (SELECT name FROM programmes)
        """
    ))


def downgrade() -> None:
    op.drop_index("ix_programmes_name", table_name="programmes")
    op.drop_table("programmes")
