"""Helpers for deleting user-owned files from storage."""

from __future__ import annotations

from urllib.parse import urlparse

from sqlalchemy.orm import Session

from ..core.config import Settings
from ..models.attendance_record import AttendanceRecord
from ..models.face_verification_job import FaceVerificationJob
from ..models.user import User
from ..services.face_verification import FaceVerificationService
from ..storage.base import Storage, get_storage

face_service = FaceVerificationService()


def storage_key_from_url(url_or_path: str | None) -> str | None:
    """Convert a stored public URL or relative path to a storage object key."""
    if not url_or_path:
        return None
    if not url_or_path.startswith("http://") and not url_or_path.startswith("https://"):
        return url_or_path.lstrip("/")

    path = urlparse(url_or_path).path or ""
    settings = Settings()
    prefixes = [
        settings.upload_mount_path().rstrip("/") + "/",
        "/uploads/",
    ]
    public_base = settings.upload_public_base().rstrip("/")
    if public_base.startswith("/"):
        prefixes.append(public_base.lstrip("/") + "/")

    normalized = path.lstrip("/")
    for prefix in prefixes:
        p = prefix.lstrip("/")
        if normalized.startswith(p):
            return normalized[len(p):]
    return normalized


def _safe_delete(storage: Storage, key: str | None) -> None:
    if not key:
        return
    try:
        if storage.exists(key):
            storage.delete(key)
    except Exception:
        pass


def delete_user_uploads(db: Session, user: User) -> None:
    """Remove face reference and selfie images owned by a user."""
    storage = get_storage()
    user_id = user.id

    keys: set[str] = set()
    if user.face_reference_path:
        keys.add(user.face_reference_path)
    keys.add(face_service.get_reference_key(user_id))

    for row in db.query(AttendanceRecord.selfie_image_path).filter(
        AttendanceRecord.student_id == user_id,
        AttendanceRecord.selfie_image_path.isnot(None),
    ):
        key = storage_key_from_url(row[0])
        if key:
            keys.add(key)

    for row in db.query(FaceVerificationJob.selfie_path).filter(
        FaceVerificationJob.user_id == user_id,
    ):
        if row[0]:
            keys.add(row[0])

    for key in keys:
        _safe_delete(storage, key)
