import os


def test_face_verification_disabled(monkeypatch, tmp_path):
    from app.services.face_verification import FaceVerificationService
    from app.core.config import Settings

    monkeypatch.setenv("FACE_VERIFICATION_ENABLED", "false")
    cfg = Settings()
    assert cfg.face_verification_enabled is False

    class FakeStorage:
        def save_bytes(self, b: bytes, key: str) -> str:
            return key
        def download_bytes(self, key: str) -> bytes:
            return b"fake"
        def delete(self, key: str) -> None:
            pass

    import app.services.face_verification
    monkeypatch.setattr(app.services.face_verification, "get_storage", lambda: FakeStorage())

    svc = FaceVerificationService()
    result = svc.verify_face(1, b"live-bytes")
    assert result["verified"] is True
    assert "reason" in result
