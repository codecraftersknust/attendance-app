from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
import shutil
import os

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
from ....models.course import Course
from ....models.student_course_enrollment import StudentCourseEnrollment
from ....services.audit import write_audit
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
    imei: str = Form(...),
    selfie: UploadFile = File(None),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_student),
):
    # Get session directly from QR session ID (no manual code needed)
    session = db.get(AttendanceSession, qr_session_id)
    if not session or not session.is_active:
        raise HTTPException(status_code=404, detail="Invalid or inactive session")

    # Validate rotating QR nonce window
    from datetime import datetime
    if not session.qr_nonce or not session.qr_expires_at:
        raise HTTPException(status_code=400, detail="QR code not generated for this session")
    
    if session.qr_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="QR code has expired. Please scan the latest QR code.")
    
    if qr_nonce != session.qr_nonce:
        raise HTTPException(status_code=400, detail="Invalid QR code. Please scan the current QR code displayed in class.")

    # Optional geofence check if session has location configured
    if session.latitude is not None and session.longitude is not None and session.geofence_radius_m:
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
            # Do not reject outright; flag instead
            pass

    cfg = Settings()
    max_size_bytes = cfg.upload_max_image_mb * 1024 * 1024
    allowed_types = set(
        [t.strip() for t in cfg.upload_allowed_image_types.split(",") if t.strip()]
    )
    storage = get_storage()

    # Store URLs for DB and filesystem paths for verification
    selfie_url = None
    selfie_fs_path = None

    # Enforce selfie when face verification is enabled
    if cfg.face_verification_enabled and selfie is None:
        raise HTTPException(status_code=400, detail="Selfie is required when face verification is enabled")

    if selfie is not None:
        if selfie.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid selfie type")
        data = await selfie.read()
        if len(data) > max_size_bytes:
            raise HTTPException(status_code=400, detail="Selfie too large")
        selfie_rel = f"selfies/{current.id}_{session.id}_{selfie.filename}"
        selfie_fs_path = storage.save_bytes(data, selfie_rel)
        selfie_url = storage.url_for(selfie_rel)

    device = (
        db.query(Device)
        .filter(Device.user_id == current.id, Device.imei == imei, Device.is_active == True)
        .first()
    )
    status = AttendanceStatus.confirmed if device else AttendanceStatus.flagged

    # If we have a selfie and a reference, perform face verification (guarded by settings inside service)
    verification = None
    ref_path = current.face_reference_path or face_service.get_reference_path(current.id)
    if selfie_fs_path and os.path.exists(ref_path):
        verification = face_service.verify_face(current.id, selfie_fs_path)
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

    record = AttendanceRecord(
        session_id=session.id,
        student_id=current.id,
        imei=imei,
        selfie_image_path=selfie_url,
        presence_image_path=None,  # No longer required - GPS + QR is sufficient
        status=status,
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
    if verification is not None:
        response.update({
            "face_verified": verification.get("verified", False),
            "face_distance": verification.get("distance"),
            "face_threshold": verification.get("threshold"),
            "face_model": verification.get("model"),
        })
    return response


@router.post("/device/bind")
def bind_device(imei: str, db: Session = Depends(get_db), current: User = Depends(get_current_student)):
    existing = db.query(Device).filter(Device.user_id == current.id).first()
    if existing:
        existing.imei = imei
        existing.is_active = True
    else:
        db.add(Device(user_id=current.id, imei=imei, is_active=True))
    db.commit()
    write_audit(db, "student.bind_device", current.id, f"imei={imei}")
    return {"status": "ok", "imei": imei}

@router.post("/enroll-face", response_model=dict)
async def enroll_face(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a selfie to store as reference face."""
    os.makedirs("uploads", exist_ok=True)
    temp_path = f"uploads/temp_{current_user.id}.jpg"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    ref_path = face_service.save_reference_face(current_user.id, temp_path)

    # Persist reference path on user for future checks
    current_user.face_reference_path = ref_path
    db.add(current_user)
    db.commit()

    return {"message": "Reference face enrolled successfully", "path": ref_path}


@router.post("/verify-face", response_model=FaceVerificationResponse)
async def verify_face(
    file: UploadFile = File(...),
    debug: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compare uploaded face with enrolled reference face."""
    os.makedirs("uploads", exist_ok=True)
    temp_path = f"uploads/temp_verify_{current_user.id}.jpg"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = face_service.verify_face(current_user.id, temp_path)

    try:
        os.remove(temp_path)
    except OSError:
        pass

    if not result.get("verified"):
        if debug:
            # Return result payload for debugging thresholds
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


@router.get("/courses/search")
def search_courses(
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_student),
):
    """Search for courses by code or name"""
    query = db.query(Course).filter(Course.is_active == True)
    
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            (Course.code.ilike(search_term)) | (Course.name.ilike(search_term))
        )
    
    courses = query.limit(20).all()
    
    # Get enrolled course IDs for current student
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
            "lecturer_name": course.lecturer.full_name if course.lecturer else None,
            "is_enrolled": course.id in enrolled_ids,
        }
        for course in courses
    ]


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
            "lecturer_name": e.course.lecturer.full_name if e.course.lecturer else None,
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
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.is_active == True
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
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

    sessions = (
        db.query(AttendanceSession)
        .filter(
            AttendanceSession.is_active == True,
            AttendanceSession.course_id.in_(enrolled_course_ids),
        )
        .order_by(AttendanceSession.created_at.desc())
        .all()
    )

    result = []
    for s in sessions:
        course = db.get(Course, s.course_id) if s.course_id else None
        result.append({
            "id": s.id,
            "code": s.code,
            "course_id": s.course_id,
            "course_code": course.code if course else None,
            "course_name": course.name if course else None,
            "starts_at": s.starts_at.isoformat() if s.starts_at else None,
            "ends_at": s.ends_at.isoformat() if s.ends_at else None,
        })

    write_audit(db, "student.list_active_sessions", current.id, f"count={len(result)}")
    return result
