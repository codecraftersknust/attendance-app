from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime, timedelta
from ....db.deps import get_db
from ....models.user import UserRole, User
from ....models.device import Device
from ....models.attendance_record import AttendanceRecord, AttendanceStatus
from ....models.attendance_session import AttendanceSession
from ....models.verification_log import VerificationLog
from ....models.audit_log import AuditLog
from ....models.course import Course
from ....models.student_course_enrollment import StudentCourseEnrollment
from ....models.school_settings import SchoolSettings, get_or_create_settings
from ....services.audit import write_audit
from ....api.deps.auth import role_required
from ....services.face_verification import FaceVerificationService
from ....services.utils import hash_device_id, utcnow

router = APIRouter(prefix="/admin", tags=["admin"])


def get_current_admin(current: User = Depends(role_required(UserRole.admin))) -> User:
    return current


# ── Course Management ──────────────────────────────────────────────


@router.get("/courses", response_model=List[dict])
def get_all_courses(
    search: Optional[str] = None,
    semester: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin),
):
    """List all courses with optional search and semester filters"""
    query = db.query(Course)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Course.code.ilike(pattern)) | (Course.name.ilike(pattern))
        )
    if semester:
        query = query.filter(Course.semester == semester)

    courses = query.order_by(Course.code).offset(offset).limit(limit).all()

    write_audit(db, "admin.get_all_courses", current.id, f"search={search}, semester={semester}")
    result = []
    for c in courses:
        enrolled_count = db.query(StudentCourseEnrollment).filter(StudentCourseEnrollment.course_id == c.id).count()
        session_count = db.query(AttendanceSession).filter(AttendanceSession.course_id == c.id).count()
        result.append({
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "description": c.description,
            "semester": c.semester,
            "level": c.level,
            "programme": c.programme,
            "lecturer_id": c.lecturer_id,
            "lecturer_name": c.lecturer.full_name if c.lecturer else None,
            "is_active": c.is_active,
            "enrolled_count": enrolled_count,
            "session_count": session_count,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })
    return result


@router.get("/courses/{course_id}", response_model=dict)
def get_course_details(
    course_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin),
):
    """Get detailed information about a specific course"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrollments = (
        db.query(StudentCourseEnrollment)
        .filter(StudentCourseEnrollment.course_id == course_id)
        .all()
    )
    enrolled_students = []
    for e in enrollments:
        student = db.get(User, e.student_id)
        if student:
            enrolled_students.append({
                "id": student.id,
                "user_id": student.user_id,
                "full_name": student.full_name,
                "email": student.email,
                "enrolled_at": e.enrolled_at.isoformat() if e.enrolled_at else None,
            })

    sessions = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.course_id == course_id)
        .order_by(desc(AttendanceSession.created_at))
        .limit(20)
        .all()
    )
    recent_sessions = []
    for s in sessions:
        att_count = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == s.id).count()
        recent_sessions.append({
            "id": s.id,
            "code": s.code,
            "is_active": s.is_active,
            "starts_at": s.starts_at.isoformat() if s.starts_at else None,
            "ends_at": s.ends_at.isoformat() if s.ends_at else None,
            "attendance_count": att_count,
        })

    write_audit(db, "admin.get_course_details", current.id, f"course_id={course_id}")
    return {
        "id": course.id,
        "code": course.code,
        "name": course.name,
        "description": course.description,
        "semester": course.semester,
        "level": course.level,
        "programme": course.programme,
        "is_active": course.is_active,
        "lecturer_id": course.lecturer_id,
        "lecturer_name": course.lecturer.full_name if course.lecturer else None,
        "created_at": course.created_at.isoformat() if course.created_at else None,
        "enrolled_students": enrolled_students,
        "enrolled_count": len(enrolled_students),
        "recent_sessions": recent_sessions,
    }


@router.post("/courses", response_model=dict)
def create_course(
    code: str,
    name: str,
    semester: str,
    description: Optional[str] = None,
    level: int = 100,
    programme: str = "General",
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin),
):
    """Create a new course (no lecturer assigned)"""
    existing = db.query(Course).filter(Course.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Course code already exists")

    if level not in (100, 200, 300, 400):
        raise HTTPException(status_code=400, detail="Level must be 100, 200, 300, or 400")

    course = Course(
        code=code,
        name=name,
        description=description,
        semester=semester,
        level=level,
        programme=programme,
        lecturer_id=None,
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    write_audit(db, "admin.create_course", current.id, f"course_id={course.id}")
    return {
        "id": course.id,
        "code": course.code,
        "name": course.name,
        "description": course.description,
        "semester": course.semester,
        "level": course.level,
        "programme": course.programme,
        "lecturer_id": None,
        "is_active": course.is_active,
    }


@router.put("/courses/{course_id}", response_model=dict)
def update_course(
    course_id: int,
    code: Optional[str] = None,
    name: Optional[str] = None,
    description: Optional[str] = None,
    semester: Optional[str] = None,
    level: Optional[int] = None,
    programme: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin),
):
    """Update any course"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if code and code != course.code:
        if db.query(Course).filter(Course.code == code).first():
            raise HTTPException(status_code=400, detail="Course code already exists")

    if level is not None and level not in (100, 200, 300, 400):
        raise HTTPException(status_code=400, detail="Level must be 100, 200, 300, or 400")

    if code is not None:
        course.code = code
    if name is not None:
        course.name = name
    if description is not None:
        course.description = description
    if semester is not None:
        course.semester = semester
    if level is not None:
        course.level = level
    if programme is not None:
        course.programme = programme
    if is_active is not None:
        course.is_active = is_active

    db.commit()
    db.refresh(course)

    write_audit(db, "admin.update_course", current.id, f"course_id={course_id}")
    return {
        "id": course.id,
        "code": course.code,
        "name": course.name,
        "description": course.description,
        "semester": course.semester,
        "level": course.level,
        "programme": course.programme,
        "lecturer_id": course.lecturer_id,
        "lecturer_name": course.lecturer.full_name if course.lecturer else None,
        "is_active": course.is_active,
    }


@router.delete("/courses/{course_id}", response_model=dict)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin),
):
    """Delete any course (removes enrollments and sessions too)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.query(StudentCourseEnrollment).filter(
        StudentCourseEnrollment.course_id == course_id
    ).delete()
    db.delete(course)
    db.commit()

    write_audit(db, "admin.delete_course", current.id, f"course_id={course_id}")
    return {"deleted": True, "course_id": course_id}


@router.post("/device/approve-reset")
def approve_device_reset(user_id: int, new_device_id: str, db: Session = Depends(get_db), current: User = Depends(get_current_admin)):
    """Approve device ID reset - device ID is hashed before storage"""
    # Hash device ID before storing
    device_id_hash = hash_device_id(new_device_id)
    
    device = db.query(Device).filter(Device.user_id == user_id).first()
    if not device:
        device = Device(user_id=user_id, device_id_hash=device_id_hash, is_active=True)
        db.add(device)
    else:
        device.device_id_hash = device_id_hash
        device.is_active = True
    db.commit()
    write_audit(db, "admin.approve_device_reset", current.id, f"user_id={user_id}")
    return {"user_id": user_id, "device_id": "***"}  # Don't return device ID for security


@router.get("/flagged", response_model=list[dict])
def list_all_flagged(db: Session = Depends(get_db), current: User = Depends(get_current_admin)):
    records = db.query(AttendanceRecord).filter(AttendanceRecord.status == AttendanceStatus.flagged).all()
    result: list[dict] = []
    for r in records:
        session = db.get(AttendanceSession, r.session_id)
        v = (
            db.query(VerificationLog)
            .filter(VerificationLog.session_id == r.session_id, VerificationLog.user_id == r.student_id)
            .order_by(VerificationLog.id.desc())
            .first()
        )
        result.append({
            "record_id": r.id,
            "session_id": r.session_id,
            "student_id": r.student_id,
            "lecturer_id": None if not session else session.lecturer_id,
            "device_id_hash": r.device_id_hash[:8] + "..." if r.device_id_hash else None,  # Show partial hash for debugging
            "face_verified": None if not v else v.verified,
            "face_distance": None if not v else v.distance,
            "face_threshold": None if not v else v.threshold,
            "face_model": None if not v else v.model,
        })
    write_audit(db, "admin.list_flagged", current.id)
    return result




@router.get("/sessions", response_model=List[dict])
def get_all_sessions(
    active_only: bool = False,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin)
):
    """Get all attendance sessions with optional filtering"""
    query = db.query(AttendanceSession)
    
    if active_only:
        query = query.filter(AttendanceSession.is_active == True)
    
    sessions = query.order_by(desc(AttendanceSession.created_at)).offset(offset).limit(limit).all()
    
    result = []
    for session in sessions:
        lecturer = db.get(User, session.lecturer_id)
        attendance_count = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id).count()
        
        result.append({
            "id": session.id,
            "code": session.code,
            "lecturer_id": session.lecturer_id,
            "lecturer_name": lecturer.full_name if lecturer else None,
            "lecturer_email": lecturer.email if lecturer else None,
            "is_active": session.is_active,
            "starts_at": session.starts_at.isoformat() if session.starts_at else None,
            "ends_at": session.ends_at.isoformat() if session.ends_at else None,
            "created_at": session.created_at.isoformat(),
            "attendance_count": attendance_count,
            "qr_nonce": session.qr_nonce,
            "qr_expires_at": session.qr_expires_at.isoformat() if session.qr_expires_at else None,
            "latitude": session.latitude,
            "longitude": session.longitude,
            "geofence_radius_m": session.geofence_radius_m
        })
    
    write_audit(db, "admin.get_all_sessions", current.id, f"active_only={active_only}, limit={limit}")
    return result


@router.get("/sessions/{session_id}/attendance", response_model=List[dict])
def get_session_attendance(
    session_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin)
):
    """Get all attendance records for a specific session"""
    session = db.get(AttendanceSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    records = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()
    
    result = []
    for record in records:
        student = db.get(User, record.student_id)
        verification_log = (
            db.query(VerificationLog)
            .filter(VerificationLog.session_id == session_id, VerificationLog.user_id == record.student_id)
            .order_by(desc(VerificationLog.id))
            .first()
        )
        
        result.append({
            "id": record.id,
            "student_id": record.student_id,
            "student_name": student.full_name if student else None,
            "student_email": student.email if student else None,
            "status": record.status.value,
            "device_id_hash": record.device_id_hash[:8] + "..." if record.device_id_hash else None,  # Show partial hash for debugging
            "selfie_image_path": record.selfie_image_path,
            "presence_image_path": record.presence_image_path,
            "created_at": record.created_at.isoformat(),
            "face_verified": verification_log.verified if verification_log else None,
            "face_distance": verification_log.distance if verification_log else None,
            "face_threshold": verification_log.threshold if verification_log else None,
            "face_model": verification_log.model if verification_log else None
        })
    
    write_audit(db, "admin.get_session_attendance", current.id, f"session_id={session_id}")
    return result


@router.get("/users", response_model=List[dict])
def get_all_users(
    role: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin)
):
    """Get all users with optional role filtering"""
    query = db.query(User)
    
    if role:
        try:
            role_enum = UserRole(role)
            query = query.filter(User.role == role_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")
    
    users = query.order_by(desc(User.created_at)).offset(offset).limit(limit).all()
    
    result = []
    for user in users:
        device = db.query(Device).filter(Device.user_id == user.id).first()
        attendance_count = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == user.id).count()
        
        result.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "user_id": user.user_id,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            "device_id_hash": device.device_id_hash[:8] + "..." if device and device.device_id_hash else None,  # Show partial hash for debugging
            "device_active": device.is_active if device else None,
            "attendance_count": attendance_count
        })
    
    write_audit(db, "admin.get_all_users", current.id, f"role={role}, limit={limit}")
    return result


@router.post("/attendance/manual-mark", response_model=dict)
def manual_mark_attendance(
    session_id: int,
    student_id: int,
    status: str = "confirmed",
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin)
):
    """Manually mark attendance for any student without verification checks"""
    session = db.get(AttendanceSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    student = db.get(User, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if student.role != UserRole.student:
        raise HTTPException(status_code=400, detail="User is not a student")
    
    # Check if attendance already exists
    existing_record = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.session_id == session_id, AttendanceRecord.student_id == student_id)
        .first()
    )
    
    if existing_record:
        raise HTTPException(status_code=400, detail="Attendance already marked for this student")
    
    try:
        attendance_status = AttendanceStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Create attendance record without verification checks
    record = AttendanceRecord(
        session_id=session_id,
        student_id=student_id,
        device_id_hash=hash_device_id("ADMIN_MANUAL"),  # Special marker for admin manual entries
        selfie_image_path=None,
        presence_image_path=None,
        status=attendance_status,
    )
    
    db.add(record)
    db.commit()
    db.refresh(record)
    
    # Create verification log entry indicating admin override
    verification_log = VerificationLog(
        user_id=student_id,
        session_id=session_id,
        verified=True,  # Admin override
        distance=0.0,
        threshold=0.0,
        model="admin_manual",
        notes=f"Admin manual mark: {reason or 'No reason provided'}"
    )
    
    db.add(verification_log)
    db.commit()

    write_audit(
        db, 
        "admin.manual_mark_attendance", 
        current.id, 
        f"session_id={session_id}, student_id={student_id}, status={status}, reason={reason}"
    )
    
    return {
        "record_id": record.id,
        "session_id": session_id,
        "student_id": student_id,
        "student_name": student.full_name,
        "status": record.status.value,
        "reason": reason,
        "marked_by": current.email,
        "marked_at": record.created_at.isoformat()
    }


@router.get("/activity", response_model=dict)
def get_system_activity(
    hours: int = 24,
    limit: int = 100,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin)
):
    """Get recent system activity including sessions, attendance, and audit logs"""
    since = utcnow() - timedelta(hours=hours)
    
    # Recent sessions
    recent_sessions = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.created_at >= since)
        .order_by(desc(AttendanceSession.created_at))
        .limit(20)
        .all()
    )
    
    # Recent attendance records
    recent_attendance = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.created_at >= since)
        .order_by(desc(AttendanceRecord.created_at))
        .limit(50)
        .all()
    )
    
    # Recent audit logs
    recent_audit_logs = (
        db.query(AuditLog)
        .filter(AuditLog.created_at >= since)
        .order_by(desc(AuditLog.created_at))
        .limit(100)
        .all()
    )
    
    # Format sessions
    sessions_data = []
    for session in recent_sessions:
        lecturer = db.get(User, session.lecturer_id)
        sessions_data.append({
            "id": session.id,
            "code": session.code,
            "lecturer_name": lecturer.full_name if lecturer else None,
            "is_active": session.is_active,
            "created_at": session.created_at.isoformat(),
            "starts_at": session.starts_at.isoformat() if session.starts_at else None
        })
    
    # Format attendance records
    attendance_data = []
    for record in recent_attendance:
        student = db.get(User, record.student_id)
        session = db.get(AttendanceSession, record.session_id)
        lecturer = db.get(User, session.lecturer_id) if session else None
        
        attendance_data.append({
            "id": record.id,
            "student_name": student.full_name if student else None,
            "lecturer_name": lecturer.full_name if lecturer else None,
            "status": record.status.value,
            "created_at": record.created_at.isoformat(),
            "session_id": record.session_id
        })
    
    # Format audit logs
    audit_data = []
    for log in recent_audit_logs:
        user = db.get(User, log.user_id) if log.user_id else None
        audit_data.append({
            "id": log.id,
            "action": log.action,
            "user_email": user.email if user else None,
            "details": log.detail,
            "timestamp": log.created_at.isoformat() if log.created_at else None
        })
    
    write_audit(db, "admin.get_system_activity", current.id, f"hours={hours}")
    
    return {
        "time_range_hours": hours,
        "recent_sessions": sessions_data,
        "recent_attendance": attendance_data,
        "recent_audit_logs": audit_data,
        "summary": {
            "sessions_count": len(sessions_data),
            "attendance_count": len(attendance_data),
            "audit_logs_count": len(audit_data)
        }
    }


@router.get("/dashboard", response_model=dict)
def admin_dashboard(db: Session = Depends(get_db), current: User = Depends(get_current_admin)):
    """Get comprehensive admin dashboard data"""
    # Basic counts
    total_users = db.query(User).count()
    total_students = db.query(User).filter(User.role == UserRole.student).count()
    total_lecturers = db.query(User).filter(User.role == UserRole.lecturer).count()
    total_sessions = db.query(AttendanceSession).count()
    active_sessions = db.query(AttendanceSession).filter(AttendanceSession.is_active == True).count()
    total_attendance = db.query(AttendanceRecord).count()
    flagged_attendance = db.query(AttendanceRecord).filter(AttendanceRecord.status == AttendanceStatus.flagged).count()
    
    # Recent activity (last 24 hours)
    since = utcnow() - timedelta(hours=24)
    recent_sessions = db.query(AttendanceSession).filter(AttendanceSession.created_at >= since).count()
    recent_attendance = db.query(AttendanceRecord).filter(AttendanceRecord.created_at >= since).count()
    
    # Status breakdown
    status_counts = (
        db.query(AttendanceRecord.status, func.count(AttendanceRecord.id))
        .group_by(AttendanceRecord.status)
        .all()
    )
    
    status_breakdown = {status.value: count for status, count in status_counts}
    
    # Top lecturers by session count
    lecturer_stats = (
        db.query(User.full_name, func.count(AttendanceSession.id))
        .join(AttendanceSession, User.id == AttendanceSession.lecturer_id)
        .group_by(User.id, User.full_name)
        .order_by(desc(func.count(AttendanceSession.id)))
        .limit(5)
        .all()
    )
    
    write_audit(db, "admin.dashboard", current.id)
    
    return {
        "overview": {
            "total_users": total_users,
            "total_students": total_students,
            "total_lecturers": total_lecturers,
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "total_attendance": total_attendance,
            "flagged_attendance": flagged_attendance
        },
        "recent_activity": {
            "sessions_last_24h": recent_sessions,
            "attendance_last_24h": recent_attendance
        },
        "status_breakdown": status_breakdown,
        "top_lecturers": [{"name": name, "session_count": count} for name, count in lecturer_stats]
    }


# ── School Settings & Semester Management ─────────────────────────


@router.get("/school-settings", response_model=dict)
def get_school_settings(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin),
):
    """Return the current academic calendar settings (singleton)."""
    settings = get_or_create_settings(db)
    write_audit(db, "admin.get_school_settings", current.id)
    return {
        "current_semester": settings.current_semester,
        "is_on_break": settings.is_on_break,
        "enrollment_open": settings.enrollment_open,
        "academic_year": settings.academic_year,
        "updated_at": settings.updated_at.isoformat() if settings.updated_at else None,
    }


@router.put("/school-settings", response_model=dict)
def update_school_settings(
    current_semester: Optional[str] = None,
    is_on_break: Optional[bool] = None,
    enrollment_open: Optional[bool] = None,
    academic_year: Optional[str] = None,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin),
):
    """Update global academic calendar settings."""
    valid_semesters = {"1st Semester", "2nd Semester"}
    if current_semester is not None and current_semester not in valid_semesters:
        raise HTTPException(status_code=400, detail="current_semester must be '1st Semester' or '2nd Semester'")

    settings = get_or_create_settings(db)
    if current_semester is not None:
        settings.current_semester = current_semester
    if is_on_break is not None:
        settings.is_on_break = is_on_break
    if enrollment_open is not None:
        settings.enrollment_open = enrollment_open
    if academic_year is not None:
        settings.academic_year = academic_year

    db.commit()
    db.refresh(settings)
    write_audit(db, "admin.update_school_settings", current.id,
                f"semester={settings.current_semester}, break={settings.is_on_break}, enroll_open={settings.enrollment_open}")
    return {
        "current_semester": settings.current_semester,
        "is_on_break": settings.is_on_break,
        "enrollment_open": settings.enrollment_open,
        "academic_year": settings.academic_year,
        "updated_at": settings.updated_at.isoformat() if settings.updated_at else None,
    }


@router.post("/semester/close", response_model=dict)
def close_semester(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_admin),
):
    """End the current semester.

    Actions performed:
    1. Close all active AttendanceSessions for courses in the current semester.
    2. Delete all StudentCourseEnrollments for those courses.
    3. Auto-increment each student's level (100→200→300→400; 400 unchanged).
    4. Mark the school as on break with enrolment closed.
    """
    settings = get_or_create_settings(db)
    semester = settings.current_semester

    # 1. Find all courses for this semester
    courses = db.query(Course).filter(Course.semester == semester).all()
    course_ids = [c.id for c in courses]

    sessions_closed = 0
    if course_ids:
        # Close active sessions
        active_sessions = (
            db.query(AttendanceSession)
            .filter(
                AttendanceSession.course_id.in_(course_ids),
                AttendanceSession.is_active == True,
            )
            .all()
        )
        for s in active_sessions:
            s.is_active = False
            s.qr_nonce = None
            s.qr_expires_at = None
        sessions_closed = len(active_sessions)

    # 2. Delete all enrolments for these courses
    students_unenrolled = 0
    if course_ids:
        students_unenrolled = (
            db.query(StudentCourseEnrollment)
            .filter(StudentCourseEnrollment.course_id.in_(course_ids))
            .delete(synchronize_session=False)
        )

    # 3. Auto-increment student levels ONLY at end of 2nd Semester.
    #    There are two semesters per academic year, so students advance
    #    after completing both (i.e., when 2nd Semester closes).
    levels_updated = 0
    is_end_of_year = semester == "2nd Semester"
    if is_end_of_year:
        level_map = {100: 200, 200: 300, 300: 400}
        students = (
            db.query(User)
            .filter(User.role == UserRole.student, User.level.in_([100, 200, 300]))
            .all()
        )
        for student in students:
            new_level = level_map.get(student.level)
            if new_level:
                student.level = new_level
                levels_updated += 1

    # 4. Advance the semester pointer and (if year-end) the academic year.
    if semester == "1st Semester":
        next_semester = "2nd Semester"
        next_year = settings.academic_year  # same academic year
    else:
        next_semester = "1st Semester"
        # Increment academic year string, e.g. "2024/2025" → "2025/2026"
        try:
            start, end = settings.academic_year.split("/")
            next_year = f"{int(end)}/{int(end) + 1}"
        except Exception:
            next_year = settings.academic_year  # fallback: keep as-is

    # 5. Mark school as on break, close enrolment, advance semester
    settings.is_on_break = True
    settings.enrollment_open = False
    settings.current_semester = next_semester
    settings.academic_year = next_year

    db.commit()

    write_audit(
        db, "admin.close_semester", current.id,
        f"semester={semester}, sessions_closed={sessions_closed}, "
        f"students_unenrolled={students_unenrolled}, levels_updated={levels_updated}",
    )
    return {
        "semester_closed": semester,
        "next_semester": next_semester,
        "sessions_closed": sessions_closed,
        "students_unenrolled": students_unenrolled,
        "levels_updated": levels_updated,
        "school_status": "on_break",
    }


