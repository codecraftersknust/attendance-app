from sqlalchemy import Integer, DateTime, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..db.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    action: Mapped[str] = mapped_column(String(128), nullable=False)
    detail: Mapped[str] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
