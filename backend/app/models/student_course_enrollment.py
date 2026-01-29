from sqlalchemy import Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from ..db.session import Base


class StudentCourseEnrollment(Base):
    __tablename__ = "student_course_enrollments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    enrolled_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student: Mapped["User"] = relationship("User", foreign_keys=[student_id])
    course: Mapped["Course"] = relationship("Course", foreign_keys=[course_id])

    __table_args__ = (
        UniqueConstraint('student_id', 'course_id', name='uq_student_course'),
    )

