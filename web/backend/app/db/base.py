# Import models here so Alembic can discover metadata
from .session import Base
from ..models.user import User, UserRole
from ..models.device import Device
from ..models.course import Course
from ..models.attendance_session import AttendanceSession
from ..models.attendance_record import AttendanceRecord, AttendanceStatus
from ..models.verification_log import VerificationLog
from ..models.audit_log import AuditLog
from ..models.student_course_enrollment import StudentCourseEnrollment

__all__ = [
    "Base",
    "User",
    "UserRole",
    "Device",
    "Course",
    "AttendanceSession",
    "AttendanceRecord",
    "AttendanceStatus",
    "VerificationLog",
    "AuditLog",
    "StudentCourseEnrollment",
]
