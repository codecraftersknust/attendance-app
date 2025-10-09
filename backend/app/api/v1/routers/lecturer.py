from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ....db.deps import get_db
from ....models.user import UserRole, User
from ....models.attendance_session import AttendanceSession
from ....models.attendance_record import AttendanceRecord, AttendanceStatus
from ....models.verification_log import VerificationLog
from ....schemas.auth import UserRead
from ....services.utils import generate_session_code
from ....services.audit import write_audit
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
    write_audit(db, "lecturer.create_session", current.id, f"session_id={session.id}")
    return {"id": session.id, "code": session.code}
@router.post("/sessions/{session_id}/regenerate", response_model=dict)
def regenerate_code(session_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    session = db.get(AttendanceSession, session_id)
    if not session or session.lecturer_id != current.id:
        raise HTTPException(status_code=404, detail="Session not found")
    session.code = generate_session_code()
    db.commit()
    write_audit(db, "lecturer.regenerate_code", current.id, f"session_id={session_id}")
    return {"id": session.id, "code": session.code}


@router.post("/sessions/{session_id}/expire", response_model=dict)
def expire_code(session_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    session = db.get(AttendanceSession, session_id)
    if not session or session.lecturer_id != current.id:
        raise HTTPException(status_code=404, detail="Session not found")
    session.is_active = False
    db.commit()
    write_audit(db, "lecturer.expire_code", current.id, f"session_id={session_id}")
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


@router.post("/sessions/{session_id}/close")
def close_session(session_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_lecturer)):
    session = db.get(AttendanceSession, session_id)
    if not session or session.lecturer_id != current.id:
        raise HTTPException(status_code=404, detail="Session not found")
    session.is_active = False
    db.commit()
    write_audit(db, "lecturer.close_session", current.id, f"session_id={session_id}")
    return {"id": session.id, "is_active": session.is_active}
