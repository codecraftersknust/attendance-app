from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.schemas.students import FaceVerificationResponse
from app.services.face_verification import FaceVerificationService
from ....db.deps import get_db
from ....api.deps.auth import role_required
from ....api.deps.auth import get_current_user
from ....models.user import UserRole, User
from ....models.attendance_session import AttendanceSession
from ....models.attendance_record import AttendanceRecord, AttendanceStatus
from ....models.device import Device
from ....models.verification_log import VerificationLog
from ....models.course import Course, CourseProgramme
from ....models.student_course_enrollment import StudentCourseEnrollment
from ....models.school_settings import get_or_create_settings
from ....services.audit import write_audit
from ....services.utils import hash_device_id, utcnow
from ....storage.base import get_storage
from ....core.config import Settings
from math import radians, cos, sin, asin, sqrt
from typing import Optional, List


face_service = FaceVerificationService()
router = APIRouter(prefix="/student", tags=["student"])


def get_current_student(current: User = Depends(role_required(UserRole.student))) -> User:
    return current



@router.post("/attendance")
async def submit_attendance(
    qr_session_id: int = Form(...),
    qr_nonce: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    device_id: str = Form(...),
    selfie: UploadFile = File(None),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_student),
):
    """Submit attendance with QR verification, geolocation, and face verification"""
    from datetime import datetime
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Attendance submission attempt - user_id={current.id}, qr_session_id={qr_session_id}, qr_nonce={qr_nonce}")
    
    # Get session directly from QR session ID (no manual code needed)
    session = db.get(AttendanceSession, qr_session_id)
    if not session or not session.is_active:
        logger.warning(f"Invalid or inactive session - session_id={qr_session_id}")
        raise HTTPException(status_code=404, detail="Invalid or inactive session")

    # Validate rotating QR nonce window
    if not session.qr_nonce or not session.qr_expires_at:
        logger.error(f"QR not generated for session {qr_session_id}")
        raise HTTPException(status_code=400, detail="QR code not generated for this session")
    
    if session.qr_expires_at < utcnow():
        logger.warning(f"QR expired for session {qr_session_id} - expires_at={session.qr_expires_at}")
        raise HTTPException(status_code=400, detail="QR code has expired. Please scan the latest QR code.")
    
    # Enforce session duration
    if session.ends_at:
        _ends_naive = session.ends_at.replace(tzinfo=None) if session.ends_at.tzinfo else session.ends_at
        _now_naive = utcnow().replace(tzinfo=None)
        if _ends_naive < _now_naive:
            logger.warning(f"Session ended - session_id={qr_session_id}, ends_at={session.ends_at}")
            raise HTTPException(status_code=400, detail="Session has ended")

    # Accept current nonce, or the previous nonce (grace for in-flight submissions during rotation)
    nonce_valid = qr_nonce == session.qr_nonce
    used_previous_nonce = False
    if not nonce_valid and session.qr_previous_nonce and qr_nonce == session.qr_previous_nonce:
        nonce_valid = True
        used_previous_nonce = True
        logger.info(f"Accepted previous nonce for session {qr_session_id} (in-flight grace)")

    if not nonce_valid:
        if session.qr_expires_at < utcnow():
            logger.warning(f"QR expired for session {qr_session_id} - expires_at={session.qr_expires_at}")
            raise HTTPException(status_code=400, detail="QR code has expired. Please scan the latest QR code.")
        logger.warning(f"Invalid QR nonce - expected={session.qr_nonce}, received={qr_nonce}")
        raise HTTPException(status_code=400, detail="Invalid QR code. Please scan the current QR code displayed in class.")

    # Enrollment check: student must be enrolled in the session's course
    enrollment = (
        db.query(StudentCourseEnrollment)
        .filter(
            StudentCourseEnrollment.student_id == current.id,
            StudentCourseEnrollment.course_id == session.course_id,
        )
        .first()
    )
    if not enrollment:
        logger.warning(f"Student {current.id} not enrolled in course {session.course_id} for session {qr_session_id}")
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    # Geofence check: student must be within radius of lecturer's set location
    # When geofence is not configured, treat as location not verified (flag for review)
    within_geofence = True
    distance_m = None
    geofence_configured = (
        session.latitude is not None
        and session.longitude is not None
        and session.geofence_radius_m is not None
    )
    if not geofence_configured:
        within_geofence = False  # Location not verified when no geofence
    else:
        def haversine(lat1, lon1, lat2, lon2):
            # Earth radius in meters
            R = 6371000.0
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a))
            return R * c

        distance_m = haversine(latitude, longitude, session.latitude, session.longitude)
        if distance_m > session.geofence_radius_m:
            within_geofence = False

    cfg = Settings()
    max_size_bytes = cfg.upload_max_image_mb * 1024 * 1024
    allowed_types = set(
        [t.strip() for t in cfg.upload_allowed_image_types.split(",") if t.strip()]
    )
    storage = get_storage()

    # Store URL for DB and raw bytes for verification
    selfie_url = None
    selfie_bytes: bytes | None = None

    # Enforce selfie when face verification is enabled
    if cfg.face_verification_enabled and selfie is None:
        raise HTTPException(status_code=400, detail="Selfie is required when face verification is enabled")

    if selfie is not None:
        if selfie.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid selfie type")
        selfie_bytes = await selfie.read()
        if len(selfie_bytes) > max_size_bytes:
            raise HTTPException(status_code=400, detail="Selfie too large")
        selfie_rel = f"selfies/{current.id}_{session.id}_{selfie.filename}"
        storage.save_bytes(selfie_bytes, selfie_rel)
        selfie_url = storage.url_for(selfie_rel)

    # Hash device ID for comparison
    device_id_hash = hash_device_id(device_id)
    
    device = (
        db.query(Device)
        .filter(Device.user_id == current.id, Device.device_id_hash == device_id_hash, Device.is_active == True)
        .first()
    )
    status = AttendanceStatus.confirmed if device else AttendanceStatus.flagged

    # Flag if student is outside the session's geofence radius
    if not within_geofence:
        status = AttendanceStatus.flagged

    # If we have a selfie and a reference, perform face verification (guarded by settings inside service)
    verification = None
    has_reference = face_service.has_reference_face(current.id)
    if selfie_bytes and has_reference:
        verification = face_service.verify_face(current.id, selfie_bytes)
        if not verification.get("verified"):
            # Flag but do not reject to avoid blocking legitimate attendance
            status = AttendanceStatus.flagged
        # Persist verification log for audit/analytics
        try:
            db.add(VerificationLog(
                user_id=current.id,
                session_id=session.id,
                verified=bool(verification.get("verified")),
                distance=verification.get("distance"),
                threshold=verification.get("threshold"),
                model=verification.get("model"),
            ))
            db.commit()
        except Exception:
            db.rollback()

    # Build flag reasons for lecturer visibility (only when status is flagged)
    flag_reasons: List[str] = []
    if status == AttendanceStatus.flagged:
        if not device:
            flag_reasons.append("device_mismatch")
        if not within_geofence:
            if not geofence_configured:
                flag_reasons.append("location_not_verified")
            else:
                flag_reasons.append("outside_geofence")
        if verification is not None and not verification.get("verified"):
            flag_reasons.append("face_not_verified")

    record = AttendanceRecord(
        session_id=session.id,
        student_id=current.id,
        device_id_hash=device_id_hash,
        selfie_image_path=selfie_url,
        presence_image_path=None,  # No longer required - GPS + QR is sufficient
        status=status,
        flag_reasons=flag_reasons if flag_reasons else None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    write_audit(
        db,
        "student.submit_attendance",
        current.id,
        f"session_id={session.id}, status={record.status.value}",
    )

    response = {"record_id": record.id, "status": record.status.value}
    if distance_m is not None:
        response["within_geofence"] = within_geofence
        response["distance_m"] = round(distance_m, 1)
    if verification is not None:
        response.update({
            "face_verified": verification.get("verified", False),
            "face_distance": verification.get("distance"),
            "face_threshold": verification.get("threshold"),
            "face_model": verification.get("model"),
        })
    return response


@router.post("/device/bind")
def bind_device(device_id: str, db: Session = Depends(get_db), current: User = Depends(get_current_student)):
    """Bind device ID to student - device ID is hashed before storage"""
    # Hash device ID before storing
    device_id_hash = hash_device_id(device_id)
    
    existing = db.query(Device).filter(Device.user_id == current.id).first()
    if existing:
        existing.device_id_hash = device_id_hash
        existing.is_active = True
    else:
        db.add(Device(user_id=current.id, device_id_hash=device_id_hash, is_active=True))
    db.commit()
    write_audit(db, "student.bind_device", current.id, f"device_id_hash={device_id_hash[:8]}...")
    return {"status": "ok", "device_id": "***"}  # Don't return device ID for security


@router.get("/device/status", response_model=dict)
def device_status(db: Session = Depends(get_db), current: User = Depends(get_current_student)):
    """Return current student's bound device status (device ID hash and active flag)."""
    device = db.query(Device).filter(Device.user_id == current.id).first()
    
    has_face = face_service.has_reference_face(current.id)
    if not has_face and current.face_reference_path:
        current.face_reference_path = None
        db.commit()

    return {
        "has_device": bool(device),
        "is_active": False if not device else bool(device.is_active),
        "has_face_enrolled": has_face,
    }

@router.post("/enroll-face", response_model=dict)
async def enroll_face(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a selfie to store as reference face in Supabase Storage."""
    image_bytes = await file.read()
    ref_key = face_service.save_reference_face(current_user.id, image_bytes)

    # Persist reference key on user for future checks
    current_user.face_reference_path = ref_key
    db.add(current_user)
    db.commit()

    return {"message": "Reference face enrolled successfully", "path": ref_key}


@router.post("/verify-face", response_model=FaceVerificationResponse)
async def verify_face(
    file: UploadFile = File(...),
    debug: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compare uploaded face with enrolled reference face."""
    image_bytes = await file.read()
    result = face_service.verify_face(current_user.id, image_bytes)

    if not result.get("verified"):
        if debug:
            return FaceVerificationResponse(
                verified=False,
                distance=result.get("distance"),
                threshold=result.get("threshold"),
                model=result.get("model"),
                error=result.get("error"),
            )
        raise HTTPException(status_code=400, detail="Face verification failed")

    return FaceVerificationResponse(
        verified=True,
        distance=result.get("distance"),
        threshold=result.get("threshold"),
        model=result.get("model"),
        error=result.get("error"),
    )


@router.get("/courses/recommended")
def get_recommended_courses(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_student),
):
    """Return courses for the student's programme+level in the current semester.

    Each course includes an `is_enrolled` flag so the frontend can show
    enrolment status without a separate call.
    """
    if not current.level or not current.programme:
        return []

    school = get_or_create_settings(db)

    courses = (
        db.query(Course)
        .join(CourseProgramme, Course.id == CourseProgramme.course_id)
        .filter(
            Course.is_active == True,
            Course.level == current.level,
            CourseProgramme.programme == current.programme,
            Course.semester == school.current_semester,
        )
        .order_by(Course.code)
        .all()
    )

    enrolled_ids = {
        e.course_id
        for e in db.query(StudentCourseEnrollment)
        .filter(StudentCourseEnrollment.student_id == current.id)
        .all()
    }

    write_audit(db, "student.recommended_courses", current.id,
                f"level={current.level}, programme={current.programme}")
    return [
        {
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "description": c.description,
            "semester": c.semester,
            "level": c.level,
            "programmes": [p.programme for p in c.programmes],
            "lecturer_names": [l.full_name for l in c.lecturers if l.full_name],
            "is_enrolled": c.id in enrolled_ids,
        }
        for c in courses
    ]


@router.get("/courses/search")
def search_courses(
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_student),
):
    """Search courses within the student's own programme and level."""
    school = get_or_create_settings(db)

    query = db.query(Course).filter(
        Course.is_active == True,
        Course.semester == school.current_semester,
    )

    # Restrict to the student's own programme+level if their profile is set
    if current.level and current.programme:
        query = (
            query
            .join(CourseProgramme, Course.id == CourseProgramme.course_id)
            .filter(
                Course.level == current.level,
                CourseProgramme.programme == current.programme,
            )
        )

    if q:
        search_term = f"%{q}%"
        query = query.filter(
            (Course.code.ilike(search_term)) | (Course.name.ilike(search_term))
        )

    courses = query.limit(20).all()

    enrolled_ids = {
        e.course_id
        for e in db.query(StudentCourseEnrollment)
        .filter(StudentCourseEnrollment.student_id == current.id)
        .all()
    }

    write_audit(db, "student.search_courses", current.id, f"query={q}")
    return [
        {
            "id": course.id,
            "code": course.code,
            "name": course.name,
            "description": course.description,
            "semester": course.semester,
            "lecturer_names": [l.full_name for l in course.lecturers if l.full_name],
            "is_enrolled": course.id in enrolled_ids,
        }
        for course in courses
    ]


@router.get("/dashboard", response_model=dict)
def student_dashboard(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_student),
):
    """Get dashboard stats for the current student."""
    from sqlalchemy import func, case

    # Single query: get all active enrollments with course info
    enrollments = (
        db.query(StudentCourseEnrollment)
        .filter(StudentCourseEnrollment.student_id == current.id)
        .join(Course, StudentCourseEnrollment.course_id == Course.id)
        .filter(Course.is_active == True)
        .all()
    )
    enrolled_count = len(enrollments)
    enrolled_course_ids = [e.course_id for e in enrollments]

    total_sessions = 0
    confirmed_count = 0
    attendance_marked_count = 0

    if enrolled_course_ids:
        now = utcnow()
        now_naive = now.replace(tzinfo=None) if now.tzinfo else now

        # Single aggregation query: count per status for this student in enrolled sessions
        status_counts = (
            db.query(
                AttendanceRecord.status,
                func.count(AttendanceRecord.id).label("cnt"),
            )
            .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
            .filter(
                AttendanceRecord.student_id == current.id,
                AttendanceSession.course_id.in_(enrolled_course_ids),
            )
            .group_by(AttendanceRecord.status)
            .all()
        )
        counts_by_status = {row.status: row.cnt for row in status_counts}
        confirmed_count = counts_by_status.get(AttendanceStatus.confirmed, 0)
        flagged_count = counts_by_status.get(AttendanceStatus.flagged, 0)
        marked_total = confirmed_count + flagged_count

        # Get the set of session IDs already marked (to exclude from past-unmarked count)
        marked_session_ids_q = (
            db.query(AttendanceRecord.session_id)
            .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
            .filter(
                AttendanceRecord.student_id == current.id,
                AttendanceSession.course_id.in_(enrolled_course_ids),
            )
            .distinct()
            .all()
        )
        marked_session_ids = {row[0] for row in marked_session_ids_q}

        # Count past (ended) sessions the student hasn't marked
        past_unmarked_q = db.query(func.count(AttendanceSession.id)).filter(
            AttendanceSession.course_id.in_(enrolled_course_ids),
            AttendanceSession.ends_at != None,
        )
        if marked_session_ids:
            past_unmarked_q = past_unmarked_q.filter(~AttendanceSession.id.in_(marked_session_ids))
        past_unmarked_count = past_unmarked_q.scalar() or 0

        total_sessions = marked_total + past_unmarked_count
        attendance_marked_count = confirmed_count

    profile_complete = bool(current.level and current.programme)
    school = get_or_create_settings(db)
    write_audit(db, "student.dashboard", current.id)
    return {
        "enrolled_courses": enrolled_count,
        "total_sessions": total_sessions,
        "attendance_marked_count": attendance_marked_count,
        "confirmed_count": confirmed_count,
        "profile_complete": profile_complete,
        "enrollment_open": school.enrollment_open,
        "current_semester": school.current_semester,
        "is_on_break": school.is_on_break,
        "academic_year": school.academic_year,
    }


@router.get("/courses")
def get_enrolled_courses(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_student),
):
    """Get all courses the student is enrolled in"""
    enrollments = (
        db.query(StudentCourseEnrollment)
        .filter(StudentCourseEnrollment.student_id == current.id)
        .join(Course)
        .filter(Course.is_active == True)
        .order_by(StudentCourseEnrollment.enrolled_at.desc())
        .all()
    )
    
    write_audit(db, "student.get_courses", current.id)
    return [
        {
            "id": e.course.id,
            "code": e.course.code,
            "name": e.course.name,
            "description": e.course.description,
            "semester": e.course.semester,
            "lecturer_names": [l.full_name for l in e.course.lecturers if l.full_name],
            "enrolled_at": e.enrolled_at.isoformat(),
        }
        for e in enrollments
    ]


@router.post("/courses/{course_id}/enroll")
def enroll_in_course(
    course_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_student),
):
    """Enroll in a course"""
    # Guard: enrolment must be open
    school = get_or_create_settings(db)
    if not school.enrollment_open:
        raise HTTPException(
            status_code=403,
            detail="Enrolment is currently closed. Please wait for the next semester.",
        )

    course = db.query(Course).filter(
        Course.id == course_id,
        Course.is_active == True
    ).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Ensure student only enrols in their own programme/level
    if current.level and current.programme:
        course_programmes = [p.programme for p in course.programmes]
        if course.level != current.level or current.programme not in course_programmes:
            raise HTTPException(
                status_code=403,
                detail="This course is not in your programme or level.",
            )

    # Check if already enrolled
    existing = db.query(StudentCourseEnrollment).filter(
        StudentCourseEnrollment.student_id == current.id,
        StudentCourseEnrollment.course_id == course_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    enrollment = StudentCourseEnrollment(
        student_id=current.id,
        course_id=course_id
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    
    write_audit(db, "student.enroll_course", current.id, f"course_id={course_id}")
    return {
        "id": enrollment.id,
        "course_id": course.id,
        "code": course.code,
        "name": course.name,
        "enrolled_at": enrollment.enrolled_at.isoformat(),
    }


@router.delete("/courses/{course_id}/enroll")
def unenroll_from_course(
    course_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_student),
):
    """Unenroll (drop) from a course."""
    enrollment = db.query(StudentCourseEnrollment).filter(
        StudentCourseEnrollment.student_id == current.id,
        StudentCourseEnrollment.course_id == course_id,
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Not enrolled in this course")
    db.delete(enrollment)
    db.commit()
    write_audit(db, "student.unenroll_course", current.id, f"course_id={course_id}")
    return {"unenrolled": True, "course_id": course_id}


@router.get("/sessions/active")
def list_active_sessions(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_student),
):
    """List active attendance sessions for courses the student is enrolled in."""
    # Find enrolled course IDs
    enrolled_course_ids = [
        e.course_id
        for e in db.query(StudentCourseEnrollment)
        .filter(StudentCourseEnrollment.student_id == current.id)
        .all()
    ]

    if not enrolled_course_ids:
        return []

    now = utcnow()
    now_naive = now.replace(tzinfo=None) if now.tzinfo else now
    sessions = (
        db.query(AttendanceSession)
        .filter(
            AttendanceSession.is_active == True,
            AttendanceSession.course_id.in_(enrolled_course_ids),
        )
        .order_by(AttendanceSession.created_at.desc())
        .all()
    )
    # Filter out expired sessions (naive-safe comparison)
    sessions = [
        s for s in sessions
        if not s.ends_at or (
            (s.ends_at.replace(tzinfo=None) if s.ends_at.tzinfo else s.ends_at) > now_naive
        )
    ]

    if not sessions:
        return []

    session_ids = [s.id for s in sessions]
    course_ids = list({s.course_id for s in sessions if s.course_id})

    # Batch fetch courses
    course_map = {
        c.id: c for c in db.query(Course).filter(Course.id.in_(course_ids)).all()
    } if course_ids else {}

    # Batch fetch this student's attendance records for these sessions
    record_map = {
        r.session_id: r
        for r in db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.session_id.in_(session_ids),
            AttendanceRecord.student_id == current.id,
        )
        .all()
    }

    result = []
    for s in sessions:
        course = course_map.get(s.course_id) if s.course_id else None
        existing = record_map.get(s.id)
        result.append({
            "id": s.id,
            "code": s.code,
            "course_id": s.course_id,
            "course_code": course.code if course else None,
            "course_name": course.name if course else None,
            "starts_at": s.starts_at.isoformat() if s.starts_at else None,
            "ends_at": s.ends_at.isoformat() if s.ends_at else None,
            "already_marked": existing is not None,
            "attendance_status": existing.status.value if existing else None,
        })

    write_audit(db, "student.list_active_sessions", current.id, f"count={len(result)}")
    return result

MAX_HISTORY_RECORDS = 100


@router.get("/attendance/history", response_model=List[dict])
def get_attendance_history(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_student),
):
    """Get full attendance history including present, flagged, and absent sessions."""
    now = utcnow()

    # 1. Get all courses the student is currently enrolled in
    enrollments = (
        db.query(StudentCourseEnrollment)
        .filter(StudentCourseEnrollment.student_id == current.id)
        .all()
    )
    enrolled_course_ids = [e.course_id for e in enrollments]

    # 2. Get all attendance records for this student (to ensure present/flagged sessions always show)
    my_records = {
        r.session_id: r
        for r in db.query(AttendanceRecord)
        .filter(AttendanceRecord.student_id == current.id)
        .all()
    }

    # 3. Build set of session IDs we need to include:
    #    - Past sessions for enrolled courses (for absent)
    #    - Sessions where student has a record (for present/flagged - must always show)
    session_ids_to_include = set()

    if enrolled_course_ids:
        past_sessions_query = (
            db.query(AttendanceSession.id)
            .filter(
                AttendanceSession.course_id.in_(enrolled_course_ids),
                AttendanceSession.ends_at != None,
                AttendanceSession.ends_at < now,
            )
        )
        session_ids_to_include.update(r[0] for r in past_sessions_query.all())

    # Always include sessions where student has a record (marked present or flagged)
    session_ids_to_include.update(my_records.keys())

    if not session_ids_to_include:
        write_audit(db, "student.get_attendance_history", current.id)
        return []

    # 4. Fetch all sessions we need
    sessions = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.id.in_(session_ids_to_include))
        .all()
    )

    # Sort by ends_at desc (most recent first); sessions with null ends_at go last
    sessions_sorted = sorted(
        sessions,
        key=lambda s: (s.ends_at is None, -(s.ends_at.timestamp() if s.ends_at else 0)),
    )

    history = []
    seen_session_ids = set()

    # Batch-fetch all courses needed for these sessions
    needed_course_ids = list({s.course_id for s in sessions_sorted if s.course_id})
    course_map = {
        c.id: c for c in db.query(Course).filter(Course.id.in_(needed_course_ids)).all()
    } if needed_course_ids else {}

    for session in sessions_sorted:
        if session.id in seen_session_ids:
            continue
        seen_session_ids.add(session.id)

        # Only include past sessions for "absent" - or any session where we have a record
        record = my_records.get(session.id)
        if record:
            status = record.status.value
        else:
            # No record - only count as absent if session has ended and student is enrolled
            if session.ends_at is None or session.ends_at >= now:
                continue
            if session.course_id not in enrolled_course_ids:
                continue
            status = "absent"

        course = course_map.get(session.course_id)
        history.append({
            "session_id": session.id,
            "session_code": session.code,
            "course_code": course.code if course else "Unknown",
            "course_name": course.name if course else "Unknown",
            "starts_at": session.starts_at.isoformat() if session.starts_at else None,
            "ends_at": session.ends_at.isoformat() if session.ends_at else None,
            "status": status,
            "record_id": record.id if record else None,
        })

    # Apply limit so we only return the most recent N records. Frontends
    # already display history in reverse-chronological order, so this does
    # not change visible behaviour for typical usage.
    limited_history = history[:MAX_HISTORY_RECORDS]
    write_audit(db, "student.get_attendance_history", current.id, f"returned={len(limited_history)}")
    return limited_history
