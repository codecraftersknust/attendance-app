from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
import enum
from ..db.session import Base


class AttendanceStatus(str, enum.Enum):
    confirmed = "confirmed"
    flagged = "flagged"


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("attendance_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    device_id_hash: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256 hash of device ID
    selfie_image_path: Mapped[str] = mapped_column(String(255), nullable=True)
    presence_image_path: Mapped[str] = mapped_column(String(255), nullable=True)
    status: Mapped[AttendanceStatus] = mapped_column(Enum(AttendanceStatus), nullable=False, default=AttendanceStatus.confirmed)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    session: Mapped["AttendanceSession"] = relationship(back_populates="records")
    student: Mapped["User"] = relationship(back_populates="attendances")
