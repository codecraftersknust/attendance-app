from .user import User, UserRole
from .device import Device
from .attendance_session import AttendanceSession
from .attendance_record import AttendanceRecord, AttendanceStatus
from .school_settings import SchoolSettings, get_or_create_settings
from .course import Course, CourseLecturer, CourseProgramme
from .student_course_enrollment import StudentCourseEnrollment

__all__ = [
    "User", "UserRole", "Device", "AttendanceSession", "AttendanceRecord", "AttendanceStatus",
    "SchoolSettings", "get_or_create_settings", "Course", "CourseLecturer", "CourseProgramme",
    "StudentCourseEnrollment",
]
