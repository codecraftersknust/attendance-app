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
            "imei": record.imei,
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
            "student_id": user.student_id,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            "device_imei": device.imei if device else None,
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
        imei="ADMIN_MANUAL",  # Special marker for admin manual entries
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
    since = datetime.utcnow() - timedelta(hours=hours)
    
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
        .filter(AuditLog.timestamp >= since)
        .order_by(desc(AuditLog.timestamp))
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
            "details": log.details,
            "timestamp": log.timestamp.isoformat()
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
    since = datetime.utcnow() - timedelta(hours=24)
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
