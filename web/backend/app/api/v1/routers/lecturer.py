from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ....db.deps import get_db
from ....models.user import UserRole, User
from ....models.attendance_session import AttendanceSession
from ....models.attendance_record import AttendanceRecord, AttendanceStatus
from ....models.verification_log import VerificationLog
from ....schemas.auth import UserRead
from ....services.utils import generate_session_code, generate_session_nonce
from ....services.audit import write_audit
from ....services.qr_rotation import add_session_to_rotation, remove_session_from_rotation
from ....api.deps.auth import role_required

router = APIRouter(prefix="/lecturer", tags=["lecturer"])


def get_current_lecturer(current: User = Depends(role_required(UserRole.lecturer))) -> User:
    return current


@router.post("/sessions", response_model=dict)
def create_session(duration_minutes: int = 15, db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    code = generate_session_code()
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    session = AttendanceSession(lecturer_id=current.id, code=code, starts_at=now, ends_at=now + timedelta(minutes=duration_minutes), is_active=True)
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Add session to automatic QR rotation
    add_session_to_rotation(session.id)
    
    write_audit(db, "lecturer.create_session", current.id, f"session_id={session.id}")
    return {"id": session.id, "code": session.code}


@router.post("/sessions/{session_id}/qr/rotate", response_model=dict)
def rotate_qr(session_id: int, ttl_seconds: int = 60, db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    from datetime import datetime, timedelta
    session = db.get(AttendanceSession, session_id)
    if not session or session.lecturer_id != current.id:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.is_active:
        raise HTTPException(status_code=400, detail="Session inactive")
    
    session.qr_nonce = generate_session_nonce()
    session.qr_expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
    db.commit()
    write_audit(db, "lecturer.rotate_qr", current.id, f"session_id={session_id}")
    
    # Enhanced QR payload with session context
    qr_payload = {
        "session_id": session.id,
        "nonce": session.qr_nonce,
        "expires_at": session.qr_expires_at.isoformat(),
        "lecturer_name": current.full_name or current.email,
        "course_code": None,  # session.course.code if session.course else None,
        "course_name": "General Session",  # session.course.name if session.course else "General Session",
        "location": {
            "latitude": session.latitude,
            "longitude": session.longitude,
            "radius_m": session.geofence_radius_m
        } if session.latitude else None,
        "session_code": session.code  # Include for display purposes
    }
    
    return {
        "session_id": session.id,
        "nonce": session.qr_nonce,
        "expires_at": session.qr_expires_at.isoformat(),
        "qr_payload": qr_payload  # This is what gets encoded in QR
    }


@router.get("/sessions/{session_id}/qr/status", response_model=dict)
def get_qr_status(session_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    from datetime import datetime
    session = db.get(AttendanceSession, session_id)
    if not session or session.lecturer_id != current.id:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session.qr_nonce or not session.qr_expires_at:
        return {
            "has_qr": False,
            "expires_at": None,
            "seconds_remaining": 0,
            "is_expired": True
        }
    
    now = datetime.utcnow()
    is_expired = session.qr_expires_at < now
    seconds_remaining = max(0, int((session.qr_expires_at - now).total_seconds()))
    
    return {
        "has_qr": True,
        "expires_at": session.qr_expires_at.isoformat(),
        "seconds_remaining": seconds_remaining,
        "is_expired": is_expired,
        "next_rotation_in": max(0, seconds_remaining - 10)  # Next rotation happens 10 seconds before expiry
    }


@router.get("/sessions/{session_id}/qr", response_model=dict)
def get_qr_payload(session_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    from datetime import datetime
    session = db.get(AttendanceSession, session_id)
    if not session or session.lecturer_id != current.id:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.qr_nonce or not session.qr_expires_at or session.qr_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="QR not generated or expired")
    
    # Return enhanced QR payload
    qr_payload = {
        "session_id": session.id,
        "nonce": session.qr_nonce,
        "expires_at": session.qr_expires_at.isoformat(),
        "lecturer_name": current.full_name or current.email,
        "course_code": None,  # session.course.code if session.course else None,
        "course_name": "General Session",  # session.course.name if session.course else "General Session",
        "location": {
            "latitude": session.latitude,
            "longitude": session.longitude,
            "radius_m": session.geofence_radius_m
        } if session.latitude else None,
        "session_code": session.code
    }
    
    return {
        "session_id": session.id,
        "nonce": session.qr_nonce,
        "expires_at": session.qr_expires_at.isoformat(),
        "qr_payload": qr_payload
    }
@router.post("/sessions/{session_id}/regenerate", response_model=dict)
def regenerate_code(session_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    session = db.get(AttendanceSession, session_id)
    if not session or session.lecturer_id != current.id:
        raise HTTPException(status_code=404, detail="Session not found")
    session.code = generate_session_code()
    db.commit()
    write_audit(db, "lecturer.regenerate_code", current.id, f"session_id={session_id}")
    return {"id": session.id, "code": session.code}


@router.post("/sessions/{session_id}/close", response_model=dict)
def close_session(session_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    session = db.get(AttendanceSession, session_id)
    if not session or session.lecturer_id != current.id:
        raise HTTPException(status_code=404, detail="Session not found")
    session.is_active = False
    session.qr_nonce = None
    session.qr_expires_at = None
    db.commit()
    
    # Remove session from automatic QR rotation
    remove_session_from_rotation(session_id)
    
    write_audit(db, "lecturer.close_session", current.id, f"session_id={session_id}")
    return {"id": session.id, "is_active": session.is_active}


@router.get("/sessions", response_model=List[dict])
def list_sessions(db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    sessions = db.query(AttendanceSession).filter(AttendanceSession.lecturer_id == current.id).order_by(AttendanceSession.id.desc()).all()
    write_audit(db, "lecturer.list_sessions", current.id)
    return [{"id": s.id, "code": s.code, "is_active": s.is_active} for s in sessions]


@router.get("/sessions/{session_id}/attendance", response_model=List[dict])
def get_attendance(session_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    session = db.get(AttendanceSession, session_id)
    if not session or session.lecturer_id != current.id:
        raise HTTPException(status_code=404, detail="Session not found")
    records = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()
    write_audit(db, "lecturer.get_attendance", current.id, f"session_id={session_id}")
    return [
        {
            "id": r.id,
            "student_id": r.student_id,
            "status": r.status.value,
            "imei": r.imei,
        }
        for r in records
    ]
@router.get("/sessions/{session_id}/flagged", response_model=List[dict])
def list_flagged_attendance(session_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    session = db.get(AttendanceSession, session_id)
    if not session or session.lecturer_id != current.id:
        raise HTTPException(status_code=404, detail="Session not found")

    records = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.session_id == session_id,
            AttendanceRecord.status == AttendanceStatus.flagged,
        )
        .all()
    )
    # Join latest verification log per student if present
    result = []
    for r in records:
        v = (
            db.query(VerificationLog)
            .filter(VerificationLog.session_id == session_id, VerificationLog.user_id == r.student_id)
            .order_by(VerificationLog.id.desc())
            .first()
        )
        result.append({
            "record_id": r.id,
            "student_id": r.student_id,
            "imei": r.imei,
            "face_verified": None if not v else v.verified,
            "face_distance": None if not v else v.distance,
            "face_threshold": None if not v else v.threshold,
            "face_model": None if not v else v.model,
        })
    write_audit(db, "lecturer.list_flagged", current.id, f"session_id={session_id}")
    return result


@router.post("/attendance/{record_id}/confirm", response_model=dict)
def confirm_flagged_attendance(record_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    record = db.get(AttendanceRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    session = db.get(AttendanceSession, record.session_id)
    if not session or session.lecturer_id != current.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    record.status = AttendanceStatus.confirmed
    db.commit()
    write_audit(db, "lecturer.confirm_attendance", current.id, f"record_id={record_id}")
    return {"record_id": record.id, "status": record.status.value}


@router.get("/dashboard", response_model=dict)
def dashboard(db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    total_sessions = db.query(AttendanceSession).filter(AttendanceSession.lecturer_id == current.id).count()
    total_records = (
        db.query(AttendanceRecord)
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(AttendanceSession.lecturer_id == current.id)
        .count()
    )
    flagged_records = (
        db.query(AttendanceRecord)
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(AttendanceSession.lecturer_id == current.id, AttendanceRecord.status == AttendanceStatus.flagged)
        .count()
    )
    write_audit(db, "lecturer.dashboard", current.id)
    return {
        "total_sessions": total_sessions,
        "total_attendance_records": total_records,
        "flagged_records": flagged_records,
    }


@router.get("/sessions/{session_id}/analytics", response_model=dict)
def get_session_analytics(session_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    """Get detailed analytics for a specific session - web-friendly endpoint"""
    session = db.get(AttendanceSession, session_id)
    if not session or session.lecturer_id != current.id:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get attendance records for this session
    records = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()
    
    # Calculate analytics
    total_students = len(records)
    present_count = len([r for r in records if r.status == AttendanceStatus.present])
    absent_count = len([r for r in records if r.status == AttendanceStatus.absent])
    flagged_count = len([r for r in records if r.status == AttendanceStatus.flagged])
    
    # Attendance rate
    attendance_rate = (present_count / total_students * 100) if total_students > 0 else 0
    
    # Recent attendance (last 10 records)
    recent_records = sorted(records, key=lambda x: x.created_at, reverse=True)[:10]
    
    write_audit(db, "lecturer.session_analytics", current.id, f"session_id={session_id}")
    return {
        "session": {
            "id": session.id,
            "code": session.code,
            "is_active": session.is_active,
            "starts_at": session.starts_at.isoformat(),
            "ends_at": session.ends_at.isoformat(),
        },
        "analytics": {
            "total_students": total_students,
            "present_count": present_count,
            "absent_count": absent_count,
            "flagged_count": flagged_count,
            "attendance_rate": round(attendance_rate, 2)
        },
        "recent_attendance": [
            {
                "student_id": r.student_id,
                "status": r.status.value,
                "timestamp": r.created_at.isoformat(),
                "verification_methods": {
                    "qr_valid": r.qr_valid,
                    "location_valid": r.location_valid,
                    "imei_valid": r.imei_valid,
                    "face_valid": r.face_valid
                }
            }
            for r in recent_records
        ]
    }


@router.get("/qr/{session_id}/display", response_model=dict)
def get_qr_display_data(session_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    """Get QR code data formatted for web display - includes QR image generation info"""
    from datetime import datetime
    
    session = db.get(AttendanceSession, session_id)
    if not session or session.lecturer_id != current.id:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not session.qr_nonce or not session.qr_expires_at or session.qr_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="QR not generated or expired")
    
    # Calculate time remaining
    time_remaining = int((session.qr_expires_at - datetime.utcnow()).total_seconds())
    
    # QR payload for encoding
    qr_payload = {
        "session_id": session.id,
        "nonce": session.qr_nonce,
        "expires_at": session.qr_expires_at.isoformat(),
        "lecturer_name": current.full_name or current.email,
        "course_code": None,
        "course_name": "General Session",
        "location": {
            "latitude": session.latitude,
            "longitude": session.longitude,
            "radius_m": session.geofence_radius_m
        } if session.latitude else None,
        "session_code": session.code
    }
    
    write_audit(db, "lecturer.qr_display", current.id, f"session_id={session_id}")
    return {
        "session_id": session.id,
        "session_code": session.code,
        "qr_payload": qr_payload,
        "qr_data": f"ABSENSE:{session.id}:{session.qr_nonce}",  # Simple format for QR generation
        "expires_at": session.qr_expires_at.isoformat(),
        "time_remaining_seconds": time_remaining,
        "is_expired": time_remaining <= 0,
        "lecturer_name": current.full_name or current.email
    }

