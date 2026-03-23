import os


def test_face_verification_disabled(monkeypatch, tmp_path):
    # Import within test so conftest path/env config is in effect
    from app.services.face_verification import FaceVerificationService
    from app.core.config import Settings

    monkeypatch.setenv("FACE_VERIFICATION_ENABLED", "false")
    cfg = Settings()
    assert cfg.face_verification_enabled is False

    from app.storage.base import Storage

    class FakeStorage(Storage):
        def save_bytes(self, b: bytes, key: str) -> str:
            return key
        def download_bytes(self, key: str) -> bytes:
            return b"fake"
        def delete(self, key: str) -> None:
            pass

    # Mock get_storage
    import app.services.face_verification
    monkeypatch.setattr(app.services.face_verification, "get_storage", lambda: FakeStorage())

    svc = FaceVerificationService()
    user_id = 1
    
    # Simulate a fake reference face in storage (handled by our fake mock above)
    live_path = tmp_path / "live.jpg"
    live_path.write_bytes(b"fake")

    result = svc.verify_face(user_id, str(live_path))
    assert result["verified"] is True
    assert "reason" in result
