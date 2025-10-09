import os


def test_face_verification_disabled(monkeypatch, tmp_path):
    # Import within test so conftest path/env config is in effect
    from app.services.face_verification import FaceVerificationService
    from app.core.config import Settings

    monkeypatch.setenv("FACE_VERIFICATION_ENABLED", "false")
    cfg = Settings()
    assert cfg.face_verification_enabled is False

    svc = FaceVerificationService(base_dir=str(tmp_path))
    user_id = 1
    ref_path = svc.get_reference_path(user_id)
    os.makedirs(os.path.dirname(ref_path), exist_ok=True)
    with open(ref_path, "wb") as f:
        f.write(b"fake")

    live_path = tmp_path / "live.jpg"
    live_path.write_bytes(b"fake")

    result = svc.verify_face(user_id, str(live_path))
    assert result["verified"] is True
    assert "reason" in result
