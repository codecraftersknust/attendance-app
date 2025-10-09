# Import models here so Alembic can discover metadata
from .session import Base
from ..models.user import User, UserRole
from ..models.device import Device
from ..models.attendance_session import AttendanceSession
from ..models.course import Course
from ..models.attendance_record import AttendanceRecord, AttendanceStatus
from ..models.verification_log import VerificationLog

__all__ = [
    "Base",
    "User",
    "UserRole",
    "Device",
    "AttendanceSession",
    "Course",
    "AttendanceRecord",
    "AttendanceStatus",
    "VerificationLog",
]

from ..models.audit_log import AuditLog
__all__.append("AuditLog")
