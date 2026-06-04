"""add face_verification_jobs table

Revision ID: c9d8e7f6a5b4
Revises: 105bcb2af9e1
Create Date: 2026-06-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "c9d8e7f6a5b4"
down_revision: Union[str, None] = "105bcb2af9e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "face_verification_jobs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("record_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("selfie_path", sa.String(length=512), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "processing",
                "done",
                "failed",
                name="faceverificationjobstatus",
            ),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["record_id"], ["attendance_records.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["attendance_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_face_verification_jobs_record_id"),
        "face_verification_jobs",
        ["record_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_face_verification_jobs_status"),
        "face_verification_jobs",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_face_verification_jobs_status"), table_name="face_verification_jobs")
    op.drop_index(op.f("ix_face_verification_jobs_record_id"), table_name="face_verification_jobs")
    op.drop_table("face_verification_jobs")
    op.execute("DROP TYPE IF EXISTS faceverificationjobstatus")
