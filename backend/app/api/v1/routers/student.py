import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.students import FaceVerificationResponse
from app.services.face_verification import FaceVerificationService
from app.services.face_verification_jobs import enqueue_face_verification
from app.services.face_storage import has_face_enrolled
from ....db.deps import get_db
from ....api.deps.auth import role_required
from ....api.deps.auth import get_current_user
from ....models.user import UserRole, User
from ....models.attendance_session import AttendanceSession
from ....models.attendance_record import AttendanceRecord, AttendanceStatus
from ....models.device import Device
from ....models.face_verification_job import FaceVerificationJob, FaceVerificationJobStatus
from ....models.course import Course, CourseProgramme
from ....models.student_course_enrollment import StudentCourseEnrollment
from ....models.school_settings import get_or_create_settings
from ....services.audit import write_audit
from ....services.utils import hash_device_id, utcnow, to_utc_iso, seconds_until
from ....services.rate_limit import rate_limit
from ....storage.base import get_storage
from ....core.config import Settings
from math import radians, cos, sin, asin, sqrt
from typing import Optional, List

logger = logging.getLogger(__name__)

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
    _rl: None = Depends(rate_limit("attendance", limit=15, window_seconds=60)),
):
    """Submit attendance with QR verification, geolocation, and face verification.

    Selfies are saved to local disk immediately; DeepFace runs in absense-face-worker.
    """
    session = db.get(AttendanceSession, qr_session_id)
    if not session or not session.is_active:
        raise HTTPException(status_code=404, detail="Invalid or inactive session")

    if not session.qr_nonce or not session.qr_expires_at:
        raise HTTPException(status_code=400, detail="QR code not generated for this session")

    qr_remaining = seconds_until(session.qr_expires_at)
    if qr_remaining is not None and qr_remaining < 0:
        raise HTTPException(status_code=400, detail="QR code has expired. Please scan the latest QR code.")

    session_remaining = seconds_until(session.ends_at)
    if session_remaining is not None and session_remaining < 0:
        raise HTTPException(status_code=400, detail="Session has ended")

    nonce_valid = qr_nonce == session.qr_nonce
    if not nonce_valid and session.qr_previous_nonce and qr_nonce == session.qr_previous_nonce:
        nonce_valid = True

    if not nonce_valid:
        raise HTTPException(status_code=400, detail="Invalid QR code. Please scan the current QR code displayed in class.")

    # Duplicate submission guard — idempotent for retries
    existing_record = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.session_id == session.id,
            AttendanceRecord.student_id == current.id,
        )
        .first()
    )
    if existing_record:
        return {
            "record_id": existing_record.id,
            "status": existing_record.status.value,
            "already_marked": True,
        }

    enrollment = (
        db.query(StudentCourseEnrollment)
        .filter(
            StudentCourseEnrollment.student_id == current.id,
            StudentCourseEnrollment.course_id == session.course_id,
        )
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    # Programme-scoped sessions can only be marked by students of that programme
    if session.programme and current.programme and session.programme != current.programme:
        raise HTTPException(
            status_code=403,
            detail=f"This session is for {session.programme} students only",
        )

    # ── Geofence (fast, in-memory math) ──────────────────────────
    within_geofence = True
    distance_m = None
    geofence_configured = (
        session.latitude is not None
        and session.longitude is not None
        and session.geofence_radius_m is not None
    )
    if not geofence_configured:
        within_geofence = False
    else:
        def haversine(lat1, lon1, lat2, lon2):
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
    storage = get_storage()
    selfie_rel: str | None = None
    selfie_url: str | None = None

    if cfg.face_verification_enabled and selfie is None:
        raise HTTPException(status_code=400, detail="Selfie is required when face verification is enabled")

    if selfie is not None:
        allowed_types = set(
            t.strip() for t in cfg.upload_allowed_image_types.split(",") if t.strip()
        )
        if selfie.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid selfie type")
        selfie_bytes = await selfie.read()
        max_size_bytes = cfg.upload_max_image_mb * 1024 * 1024
        if len(selfie_bytes) > max_size_bytes:
            raise HTTPException(status_code=400, detail="Selfie too large")
        selfie_rel = f"selfies/{current.id}_{session.id}_{selfie.filename}"
        storage.save_bytes(selfie_bytes, selfie_rel)
        selfie_url = storage.url_for(selfie_rel)

    # ── Device check ─────────────────────────────────────────────
    device_id_hash = hash_device_id(device_id)
    device = (
        db.query(Device)
        .filter(Device.user_id == current.id, Device.device_id_hash == device_id_hash, Device.is_active == True)
        .first()
    )
    device_matched = device is not None
    status = AttendanceStatus.confirmed if device_matched else AttendanceStatus.flagged

    if not within_geofence:
        status = AttendanceStatus.flagged

    face_check_pending = bool(selfie_rel and cfg.face_verification_enabled)
    if face_check_pending and status == AttendanceStatus.confirmed:
        status = AttendanceStatus.pending_verification

    # ── Build initial flag reasons (face verification added later in background)
    flag_reasons: List[str] = []
    if status == AttendanceStatus.flagged:
        if not device_matched:
            flag_reasons.append("device_mismatch")
        if not within_geofence:
            flag_reasons.append("location_not_verified" if not geofence_configured else "outside_geofence")

    # ── Persist record immediately — no waiting for upload/ML ────
    record = AttendanceRecord(
        session_id=session.id,
        student_id=current.id,
        device_id_hash=device_id_hash,
        selfie_image_path=selfie_url,
        presence_image_path=None,
        status=status,
        flag_reasons=flag_reasons if flag_reasons else None,
    )
    db.add(record)
    db.flush()
    if selfie_rel and cfg.face_verification_enabled:
        enqueue_face_verification(
            db,
            record_id=record.id,
            user_id=current.id,
            session_id=session.id,
            selfie_path=selfie_rel,
        )
    db.commit()
    db.refresh(record)

    response = {"record_id": record.id, "status": record.status.value}
    if face_check_pending:
        response["face_verification_pending"] = True
    if distance_m is not None:
        response["within_geofence"] = within_geofence
        response["distance_m"] = round(distance_m, 1)
    return response


@router.get("/attendance/records/{record_id}")
def get_attendance_record_status(
    record_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_student),
):
    """Poll attendance record status after submission (face verification runs async)."""
    record = db.get(AttendanceRecord, record_id)
    if not record or record.student_id != current.id:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    job_pending = (
        db.query(FaceVerificationJob)
        .filter(
            FaceVerificationJob.record_id == record_id,
            FaceVerificationJob.status.in_(
                [FaceVerificationJobStatus.pending, FaceVerificationJobStatus.processing]
            ),
        )
        .first()
        is not None
    )

    return {
        "record_id": record.id,
        "status": record.status.value,
        "flag_reasons": record.flag_reasons,
        "face_verification_pending": job_pending
        or record.status == AttendanceStatus.pending_verification,
    }


class DeviceBindRequest(BaseModel):
    device_id: str


@router.post("/device/bind")
def bind_device(
    device_id: str | None = None,
    payload: DeviceBindRequest | None = None,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_student),
):
    """Bind device ID to student - device ID is hashed before storage.

    Prefers a JSON body (keeps the device ID out of access logs); the query
    parameter is still accepted for older mobile builds.
    """
    raw_device_id = (payload.device_id if payload else None) or device_id
    if not raw_device_id or not raw_device_id.strip():
        raise HTTPException(status_code=422, detail="device_id is required")
    device_id_hash = hash_device_id(raw_device_id.strip())
    
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
    
    has_face = has_face_enrolled(current)
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
    """Upload a selfie to store as reference face on local disk."""
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
    pending_count = 0
    attendance_marked_count = 0

    if enrolled_course_ids:
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
        pending_count = counts_by_status.get(AttendanceStatus.pending_verification, 0)
        marked_total = confirmed_count + flagged_count + pending_count

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
        from sqlalchemy import or_
        past_unmarked_q = db.query(func.count(AttendanceSession.id)).filter(
            AttendanceSession.course_id.in_(enrolled_course_ids),
            AttendanceSession.ends_at != None,
        )
        if current.programme:
            past_unmarked_q = past_unmarked_q.filter(
                or_(
                    AttendanceSession.programme.is_(None),
                    AttendanceSession.programme == current.programme,
                )
            )
        if marked_session_ids:
            past_unmarked_q = past_unmarked_q.filter(~AttendanceSession.id.in_(marked_session_ids))
        past_unmarked_count = past_unmarked_q.scalar() or 0

        total_sessions = marked_total + past_unmarked_count
        attendance_marked_count = confirmed_count + pending_count

    profile_complete = bool(current.level and current.programme)
    school = get_or_create_settings(db)
    write_audit(db, "student.dashboard", current.id)
    return {
        "enrolled_courses": enrolled_count,
        "total_sessions": total_sessions,
        "attendance_marked_count": attendance_marked_count,
        "confirmed_count": confirmed_count,
        "pending_count": pending_count if enrolled_course_ids else 0,
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
            "enrolled_at": to_utc_iso(e.enrolled_at),
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
        "enrolled_at": to_utc_iso(enrollment.enrolled_at),
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

    from sqlalchemy import or_
    sessions_q = (
        db.query(AttendanceSession)
        .filter(
            AttendanceSession.is_active == True,
            AttendanceSession.course_id.in_(enrolled_course_ids),
        )
    )
    # Hide sessions scoped to another programme's class (same course can be
    # taken by multiple programmes)
    if current.programme:
        sessions_q = sessions_q.filter(
            or_(
                AttendanceSession.programme.is_(None),
                AttendanceSession.programme == current.programme,
            )
        )
    sessions = sessions_q.order_by(AttendanceSession.created_at.desc()).all()
    # Filter out expired sessions (timezone-safe comparison)
    sessions = [
        s for s in sessions
        if not s.ends_at or (seconds_until(s.ends_at) or 0) > 0
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
            "programme": s.programme,
            "starts_at": to_utc_iso(s.starts_at),
            "ends_at": to_utc_iso(s.ends_at),
            # Server-computed countdown so clients don't depend on their own
            # clock matching the server's
            "time_remaining_seconds": seconds_until(s.ends_at),
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
        from sqlalchemy import or_
        past_sessions_query = (
            db.query(AttendanceSession.id)
            .filter(
                AttendanceSession.course_id.in_(enrolled_course_ids),
                AttendanceSession.ends_at != None,
                AttendanceSession.ends_at < now,
            )
        )
        # Sessions held for another programme's class don't count as absences
        if current.programme:
            past_sessions_query = past_sessions_query.filter(
                or_(
                    AttendanceSession.programme.is_(None),
                    AttendanceSession.programme == current.programme,
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
            remaining = seconds_until(session.ends_at)
            if remaining is None or remaining >= 0:
                continue
            if session.course_id not in enrolled_course_ids:
                continue
            if session.programme and current.programme and session.programme != current.programme:
                continue
            status = "absent"

        course = course_map.get(session.course_id)
        history.append({
            "session_id": session.id,
            "session_code": session.code,
            "course_code": course.code if course else "Unknown",
            "course_name": course.name if course else "Unknown",
            "starts_at": to_utc_iso(session.starts_at),
            "ends_at": to_utc_iso(session.ends_at),
            "status": status,
            "record_id": record.id if record else None,
        })

    # Apply limit so we only return the most recent N records. Frontends
    # already display history in reverse-chronological order, so this does
    # not change visible behaviour for typical usage.
    limited_history = history[:MAX_HISTORY_RECORDS]
    write_audit(db, "student.get_attendance_history", current.id, f"returned={len(limited_history)}")
    return limited_history
