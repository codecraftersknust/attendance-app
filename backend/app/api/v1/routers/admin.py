from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ....db.deps import get_db
from ....models.user import UserRole, User
from ....models.device import Device
from ....models.attendance_record import AttendanceRecord, AttendanceStatus
from ....models.attendance_session import AttendanceSession
from ....models.verification_log import VerificationLog
from ....services.audit import write_audit
from ....api.deps.auth import role_required
from ....services.face_verification import FaceVerificationService

router = APIRouter(prefix="/admin", tags=["admin"])


def get_current_admin(current: User = Depends(role_required(UserRole.admin))) -> User:
    return current


@router.post("/imei/approve-reset")
def approve_imei_reset(user_id: int, new_imei: str, db: Session = Depends(get_db), current: User = Depends(get_current_admin)):
    device = db.query(Device).filter(Device.user_id == user_id).first()
    if not device:
        device = Device(user_id=user_id, imei=new_imei, is_active=True)
        db.add(device)
    else:
        device.imei = new_imei
        device.is_active = True
    db.commit()
    write_audit(db, "admin.approve_imei_reset", current.id, f"user_id={user_id}")
    return {"user_id": user_id, "imei": new_imei}


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
            "imei": r.imei,
            "face_verified": None if not v else v.verified,
            "face_distance": None if not v else v.distance,
            "face_threshold": None if not v else v.threshold,
            "face_model": None if not v else v.model,
        })
    write_audit(db, "admin.list_flagged", current.id)
    return result


@router.post("/attendance/{record_id}/set-status", response_model=dict)
def set_attendance_status(record_id: int, status: str, db: Session = Depends(get_db), current: User = Depends(get_current_admin)):
    record = db.get(AttendanceRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    try:
        new_status = AttendanceStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")
    record.status = new_status
    db.commit()
    write_audit(db, "admin.set_attendance_status", current.id, f"record_id={record_id}, status={status}")
    return {"record_id": record.id, "status": record.status.value}


@router.get("/analytics", response_model=dict)
def analytics(db: Session = Depends(get_db), current: User = Depends(get_current_admin)):
    total_users = db.query(User).count()
    total_records = db.query(AttendanceRecord).count()
    flagged_records = db.query(AttendanceRecord).filter(AttendanceRecord.status == AttendanceStatus.flagged).count()
    total_sessions = db.query(AttendanceSession).count()
    write_audit(db, "admin.analytics", current.id)
    return {
        "total_users": total_users,
        "total_sessions": total_sessions,
        "total_attendance_records": total_records,
        "flagged_records": flagged_records,
    }


@router.post("/attendance/{record_id}/verify", response_model=dict)
def admin_verify_attendance(record_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_admin)):
    """Allow admin to force-verify an attendance record by running face match if possible
    and setting the status accordingly.
    """
    record = db.get(AttendanceRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    session = db.get(AttendanceSession, record.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Attempt face verification if presence or selfie available
    face_service = FaceVerificationService()
    verified = None
    distance = threshold = None
    model = None
    from ....models.user import User as DbUser
    user = db.get(DbUser, record.student_id)
    if user and (record.presence_image_path or record.selfie_image_path):
        # presence_image_path/selfie_image_path is a URL; the service handles local paths if configured
        # If local storage, we may not have the filesystem path; service will no-op if disabled
        try:
            image_path = record.presence_image_path or record.selfie_image_path
            res = face_service.verify_face(user.id, image_path)
            verified = bool(res.get("verified"))
            distance = res.get("distance")
            threshold = res.get("threshold")
            model = res.get("model")
            db.add(VerificationLog(
                user_id=user.id,
                session_id=session.id,
                verified=verified,
                distance=distance,
                threshold=threshold,
                model=model,
            ))
            db.commit()
        except Exception:
            db.rollback()

    # If verification ran and passed, confirm; otherwise set flagged
    if verified is True:
        record.status = AttendanceStatus.confirmed
    else:
        record.status = AttendanceStatus.flagged
    db.commit()

    write_audit(db, "admin.verify_attendance", current.id, f"record_id={record_id}, verified={verified}")
    return {
        "record_id": record.id,
        "status": record.status.value,
        "face_verified": verified,
        "face_distance": distance,
        "face_threshold": threshold,
        "face_model": model,
    }
