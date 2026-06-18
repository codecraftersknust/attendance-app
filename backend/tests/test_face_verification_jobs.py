"""Face verification job processing with pending_verification status."""


def test_apply_verification_confirms_pending_record():
    from app.models.attendance_record import AttendanceRecord, AttendanceStatus
    from app.services.face_verification_jobs import _apply_verification_result

    record = AttendanceRecord(
        session_id=1,
        student_id=1,
        device_id_hash="abc",
        status=AttendanceStatus.pending_verification,
    )
    _apply_verification_result(record, {"verified": True})
    assert record.status == AttendanceStatus.confirmed


def test_apply_verification_flags_pending_on_failure():
    from app.models.attendance_record import AttendanceRecord, AttendanceStatus
    from app.services.face_verification_jobs import _apply_verification_result

    record = AttendanceRecord(
        session_id=1,
        student_id=1,
        device_id_hash="abc",
        status=AttendanceStatus.pending_verification,
    )
    _apply_verification_result(record, {"verified": False, "model": "Facenet512"})
    assert record.status == AttendanceStatus.flagged
    assert "face_not_verified" in (record.flag_reasons or [])


def test_deepface_unavailable_fails_closed(monkeypatch):
    import app.services.face_verification as fv

    monkeypatch.setattr(fv, "_DEEPFACE_AVAILABLE", False)
    monkeypatch.setenv("FACE_VERIFICATION_ENABLED", "true")

    class FakeStorage:
        def download_bytes(self, key: str) -> bytes:
            return b"ref"

    monkeypatch.setattr(fv, "get_storage", lambda: FakeStorage())

    svc = fv.FaceVerificationService()
    result = svc.verify_face(1, b"live")
    assert result["verified"] is False
    assert result.get("model") == "unavailable"
