from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
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
from ....services.audit import write_audit
from ....storage.base import get_storage
from ....core.config import Settings


face_service = FaceVerificationService()
router = APIRouter(prefix="/student", tags=["student"])


def get_current_student(current: User = Depends(role_required(UserRole.student))) -> User:
    return current



@router.post("/attendance")
async def submit_attendance(
    code: str = Form(...),
    imei: str = Form(...),
    selfie: UploadFile = File(None),
    presence: UploadFile = File(None),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_student),
):
    session = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.code == code, AttendanceSession.is_active == True)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Invalid or inactive code")

    cfg = Settings()
    max_size_bytes = cfg.upload_max_image_mb * 1024 * 1024
    allowed_types = set(
        [t.strip() for t in cfg.upload_allowed_image_types.split(",") if t.strip()]
    )
    storage = get_storage()

    # Store URLs for DB and filesystem paths for verification
    selfie_url = None
    presence_url = None
    selfie_fs_path = None
    presence_fs_path = None

    if selfie is not None:
        if selfie.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid selfie type")
        data = await selfie.read()
        if len(data) > max_size_bytes:
            raise HTTPException(status_code=400, detail="Selfie too large")
        selfie_rel = f"selfies/{current.id}_{session.id}_{selfie.filename}"
        selfie_fs_path = storage.save_bytes(data, selfie_rel)
        selfie_url = storage.url_for(selfie_rel)

    if presence is not None:
        if presence.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid presence type")
        pdata = await presence.read()
        if len(pdata) > max_size_bytes:
            raise HTTPException(status_code=400, detail="Presence image too large")
        presence_rel = f"presence/{current.id}_{session.id}_{presence.filename}"
        presence_fs_path = storage.save_bytes(pdata, presence_rel)
        presence_url = storage.url_for(presence_rel)

    device = (
        db.query(Device)
        .filter(Device.user_id == current.id, Device.imei == imei, Device.is_active == True)
        .first()
    )
    status = AttendanceStatus.confirmed if device else AttendanceStatus.flagged

    # If we have an image and a reference, perform face verification (guarded by settings inside service)
    verification = None
    image_to_check = presence_fs_path or selfie_fs_path
    ref_path = current.face_reference_path or face_service.get_reference_path(current.id)
    if image_to_check and os.path.exists(ref_path):
        verification = face_service.verify_face(current.id, image_to_check)
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
        presence_image_path=presence_url,
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
        raise HTTPException(status_code=400, detail="Face verification failed")

    return result
