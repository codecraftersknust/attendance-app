from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from ..db.session import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)  # e.g., "CS101", "MATH201"
    name: Mapped[str] = mapped_column(String(200))  # e.g., "Introduction to Computer Science"
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    semester: Mapped[str] = mapped_column(String(20))  # e.g., "Fall 2024", "Spring 2025"
    lecturer_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    lecturer: Mapped["User"] = relationship("User", back_populates="courses")
    sessions: Mapped[list["AttendanceSession"]] = relationship("AttendanceSession", back_populates="course", cascade="all, delete-orphan")