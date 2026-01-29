from sqlalchemy import String, Integer, Boolean, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum
from ..db.session import Base


class UserRole(str, enum.Enum):
    student = "student"
    lecturer = "lecturer"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    user_id: Mapped[str | None] = mapped_column(String(50), unique=True, index=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    face_reference_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.student)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    devices: Mapped[list["Device"]] = relationship(back_populates="user")
    lecturer_sessions: Mapped[list["AttendanceSession"]] = relationship(back_populates="lecturer")
    attendances: Mapped[list["AttendanceRecord"]] = relationship(back_populates="student")
    courses: Mapped[list["Course"]] = relationship("Course", back_populates="lecturer")
