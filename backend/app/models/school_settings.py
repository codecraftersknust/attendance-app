from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from ..db.session import Base


class SchoolSettings(Base):
    """Singleton row (id=1) storing the global academic calendar state.

    Admins update this to reflect the current semester, break status, and
    whether student enrolment is open.
    """

    __tablename__ = "school_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    current_semester: Mapped[str] = mapped_column(
        String(30), nullable=False, default="1st Semester", server_default="1st Semester"
    )
    is_on_break: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    enrollment_open: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    academic_year: Mapped[str] = mapped_column(
        String(20), nullable=False, default="2024/2025", server_default="2024/2025"
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


def get_or_create_settings(db) -> SchoolSettings:
    """Return the singleton settings row, creating a default if absent."""
    settings = db.get(SchoolSettings, 1)
    if not settings:
        settings = SchoolSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings
