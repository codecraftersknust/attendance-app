"""Enqueue and process face verification jobs (API enqueues; worker processes)."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..models.attendance_record import AttendanceRecord, AttendanceStatus
from ..models.face_verification_job import FaceVerificationJob, FaceVerificationJobStatus
from ..models.verification_log import VerificationLog
from ..services.face_verification import FaceVerificationService
from ..storage.base import get_storage

logger = logging.getLogger(__name__)
face_service = FaceVerificationService()


def enqueue_face_verification(
    db: Session,
    *,
    record_id: int,
    user_id: int,
    session_id: int,
    selfie_path: str,
) -> None:
    db.add(
        FaceVerificationJob(
            record_id=record_id,
            user_id=user_id,
            session_id=session_id,
            selfie_path=selfie_path,
            status=FaceVerificationJobStatus.pending,
        )
    )


def _append_flag_reason(record: AttendanceRecord, reason: str) -> None:
    reasons = list(record.flag_reasons or [])
    if reason not in reasons:
        reasons.append(reason)
    record.flag_reasons = reasons


def _apply_verification_result(record: AttendanceRecord | None, verification: dict) -> None:
    """Update attendance record based on face verification outcome."""
    if not record:
        return

    verified = bool(verification.get("verified"))
    if verified:
        if record.status == AttendanceStatus.pending_verification:
            record.status = AttendanceStatus.confirmed
        return

    model = verification.get("model")
    if model == "unavailable":
        _append_flag_reason(record, "face_verification_unavailable")
    else:
        _append_flag_reason(record, "face_not_verified")

    if record.status in (AttendanceStatus.pending_verification, AttendanceStatus.confirmed):
        record.status = AttendanceStatus.flagged


def _flag_job_failure(record: AttendanceRecord | None) -> None:
    if not record:
        return
    if record.status in (AttendanceStatus.pending_verification, AttendanceStatus.confirmed):
        record.status = AttendanceStatus.flagged
    _append_flag_reason(record, "face_verification_failed")


def process_one_job(db: Session) -> bool:
    """Claim and process one pending job. Returns True if a job was processed."""
    q = (
        db.query(FaceVerificationJob)
        .filter(FaceVerificationJob.status == FaceVerificationJobStatus.pending)
        .order_by(FaceVerificationJob.created_at)
    )
    if db.bind.dialect.name == "postgresql":
        job = q.with_for_update(skip_locked=True).first()
    else:
        job = q.first()
    if not job:
        return False

    job.status = FaceVerificationJobStatus.processing
    db.commit()

    try:
        storage = get_storage()
        selfie_bytes = storage.download_bytes(job.selfie_path)
        record = db.get(AttendanceRecord, job.record_id)
        if record and not record.selfie_image_path:
            record.selfie_image_path = storage.url_for(job.selfie_path)

        if not face_service.has_reference_face(job.user_id):
            verification = {
                "verified": False,
                "error": "No reference face enrolled",
                "model": "none",
            }
        else:
            verification = face_service.verify_face(job.user_id, selfie_bytes)

        db.add(
            VerificationLog(
                user_id=job.user_id,
                session_id=job.session_id,
                verified=bool(verification.get("verified")),
                distance=verification.get("distance"),
                threshold=verification.get("threshold"),
                model=verification.get("model"),
            )
        )

        _apply_verification_result(record, verification)

        job.status = FaceVerificationJobStatus.done
        job.processed_at = datetime.now(timezone.utc)
        db.commit()
    except Exception:
        logger.exception("Face verification job %s failed", job.id)
        db.rollback()
        job = db.get(FaceVerificationJob, job.id)
        if job:
            record = db.get(AttendanceRecord, job.record_id)
            _flag_job_failure(record)
            job.status = FaceVerificationJobStatus.failed
            job.processed_at = datetime.now(timezone.utc)
            db.commit()
    return True
