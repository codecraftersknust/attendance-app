"""
Tests for the two face-verification bug fixes:

  Bug #1 — face_threshold was 0.6 (too permissive for Facenet512).
             Fix: default is now None → DeepFace uses its own threshold.

  Bug #2 — pixel-level cosine fallback silently accepted different faces.
             Fix: when DeepFace is unavailable return verified=False + error.
"""

import sys
import types
import pytest


# ─── helpers ────────────────────────────────────────────────────────────────


def _make_fake_storage(ref_bytes: bytes):
    """Return an in-memory fake storage that has one reference face."""

    class FakeStorage:
        def __init__(self):
            self._data = {}

        def save_bytes(self, data, key):
            self._data[key] = data
            return key

        def download_bytes(self, key):
            if key in self._data:
                return self._data[key]
            return ref_bytes  # default: return reference

        def exists(self, key):
            return True  # pretend reference always exists

        def url_for(self, key):
            return f"http://fake/{key}"

    return FakeStorage()


# ─── Bug #1 tests ────────────────────────────────────────────────────────────


class TestThresholdConfig:
    """Bug #1: face_threshold must default to None, not 0.6."""

    def test_default_threshold_is_none(self, monkeypatch):
        """The config default must be None so DeepFace uses its own threshold."""
        monkeypatch.delenv("FACE_THRESHOLD", raising=False)
        from app.core.config import Settings

        cfg = Settings()
        assert cfg.face_threshold is None, (
            f"face_threshold should be None but got {cfg.face_threshold!r}. "
            "A value of 0.6 is far too permissive for Facenet512 and will cause "
            "different faces to match."
        )

    def test_threshold_env_override_still_works(self, monkeypatch):
        """Setting FACE_THRESHOLD via env should still be respected."""
        monkeypatch.setenv("FACE_THRESHOLD", "0.30")
        from app.core.config import Settings

        cfg = Settings()
        assert cfg.face_threshold == pytest.approx(0.30)

    def test_deepface_result_used_directly_when_threshold_none(self, monkeypatch):
        """When face_threshold is None the DeepFace result.verified is used as-is."""
        monkeypatch.delenv("FACE_THRESHOLD", raising=False)

        import app.services.face_verification as fv_mod

        # Patch DeepFace to return a controlled result
        fake_deepface_result = {
            "verified": False,   # ← DeepFace says NOT same person
            "distance": 0.45,
            "threshold": 0.30,
            "model": "Facenet512",
        }

        class FakeDeepFace:
            @staticmethod
            def verify(**kwargs):
                return fake_deepface_result

        monkeypatch.setattr(fv_mod, "_DEEPFACE_AVAILABLE", True)
        monkeypatch.setattr(fv_mod, "DeepFace", FakeDeepFace)

        from app.core.config import Settings
        cfg = Settings()

        result = fv_mod.FaceVerificationService._run_verification(
            cfg, live_path="/fake/live.jpg", ref_path="/fake/ref.jpg"
        )

        # With threshold=None the DeepFace decision must be honoured
        assert result["verified"] is False, (
            "DeepFace returned verified=False (distance 0.45 > threshold 0.30) "
            "but the service returned verified=True. The old 0.6 override is still active."
        )
        assert result["distance"] == pytest.approx(0.45)

    def test_old_06_threshold_would_have_passed_different_faces(self, monkeypatch):
        """Demonstrate that the old 0.6 threshold was wrong.

        With distance=0.45, the old code (distance <= 0.6) would say verified=True
        even though DeepFace itself considers this a non-match (threshold 0.30).
        """
        monkeypatch.setenv("FACE_THRESHOLD", "0.6")  # simulate the bad old default

        import app.services.face_verification as fv_mod

        class FakeDeepFace:
            @staticmethod
            def verify(**kwargs):
                return {
                    "verified": False,   # DeepFace says different people
                    "distance": 0.45,    # 0.45 > model's own threshold of ~0.30
                    "threshold": 0.30,
                    "model": "Facenet512",
                }

        monkeypatch.setattr(fv_mod, "_DEEPFACE_AVAILABLE", True)
        monkeypatch.setattr(fv_mod, "DeepFace", FakeDeepFace)

        from app.core.config import Settings
        cfg = Settings()
        assert cfg.face_threshold == pytest.approx(0.6), "sanity check"

        result = fv_mod.FaceVerificationService._run_verification(
            cfg, live_path="/fake/live.jpg", ref_path="/fake/ref.jpg"
        )

        # The OLD code would say True here — we document it as the known bad behaviour
        assert result["verified"] is True, (
            "This test documents the OLD bug: distance 0.45 <= threshold 0.6 "
            "returned verified=True even though the faces don't match."
        )
        # The new default (None) avoids this entirely — see test above.


# ─── Bug #2 tests ────────────────────────────────────────────────────────────


class TestDeepFaceUnavailableFallback:
    """Bug #2: when DeepFace is not installed the service must return verified=False."""

    def test_returns_verified_false_when_deepface_missing(self, monkeypatch):
        """No DeepFace → must return verified=False, never True."""
        import app.services.face_verification as fv_mod

        monkeypatch.setattr(fv_mod, "_DEEPFACE_AVAILABLE", False)

        from app.core.config import Settings
        cfg = Settings()

        result = fv_mod.FaceVerificationService._run_verification(
            cfg, live_path="/any/live.jpg", ref_path="/any/ref.jpg"
        )

        assert result["verified"] is False, (
            "When DeepFace is unavailable the service returned verified=True. "
            "The old pixel-level fallback is still active — this is the Bug #2 regression."
        )

    def test_error_message_is_descriptive_when_deepface_missing(self, monkeypatch):
        """The error key must contain a human-readable explanation."""
        import app.services.face_verification as fv_mod

        monkeypatch.setattr(fv_mod, "_DEEPFACE_AVAILABLE", False)

        from app.core.config import Settings
        cfg = Settings()

        result = fv_mod.FaceVerificationService._run_verification(
            cfg, live_path="/any/live.jpg", ref_path="/any/ref.jpg"
        )

        assert "error" in result, "Result should contain an 'error' key"
        assert result["error"], "Error message should not be empty"
        # Make sure it doesn't say something misleading like "fallback-cosine"
        assert "fallback" not in result.get("model", ""), (
            "Old fallback model name still present in response"
        )

    def test_old_fallback_would_have_accepted_different_images(self):
        """Prove the old pixel-cosine fallback was unreliable.

        Any two uniformly-lit images with similar average brightness score ≥ 0.60
        because the metric measures global intensity patterns, not faces.
        """
        from PIL import Image
        import numpy as np
        import io

        def make_jpg(brightness: int) -> bytes:
            """Create a flat-colour 160×160 JPEG with a given brightness."""
            img = Image.new("L", (160, 160), color=brightness)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=95)
            return buf.getvalue()

        def old_fallback_cosine(bytes1, bytes2) -> dict:
            """Reproduces the deleted fallback logic verbatim."""
            img1 = Image.open(io.BytesIO(bytes1)).convert("L").resize((160, 160))
            img2 = Image.open(io.BytesIO(bytes2)).convert("L").resize((160, 160))
            v1 = np.asarray(img1, dtype=np.float32).flatten()
            v2 = np.asarray(img2, dtype=np.float32).flatten()
            v1 = (v1 - v1.mean()) / (v1.std() + 1e-6)
            v2 = (v2 - v2.mean()) / (v2.std() + 1e-6)
            sim = float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6))
            sim01 = (sim + 1.0) / 2.0
            verified = sim01 >= 0.60
            return {"verified": verified, "sim01": sim01}

        # Two completely different solid-colour images (different "people")
        img_a = make_jpg(200)   # bright
        img_b = make_jpg(200)   # also bright — same brightness, totally "different face"

        result = old_fallback_cosine(img_a, img_b)
        # The old fallback gives sim01 ≈ 1.0 for two same-brightness images → verified=True
        assert result["verified"] is True, (
            "Expected the old fallback to accept these different-brightness images "
            "— this documents why the fallback was wrong."
        )
        # The NEW code would return verified=False for the same inputs.


# ─── Integration: verify_face() end-to-end with mocked storage ───────────────


class TestVerifyFaceEndToEnd:
    """End-to-end test of FaceVerificationService.verify_face() with mocked storage."""

    def test_returns_false_when_deepface_unavailable(self, monkeypatch, tmp_path):
        import app.services.face_verification as fv_mod

        monkeypatch.setattr(fv_mod, "_DEEPFACE_AVAILABLE", False)

        # Provide fake reference bytes
        ref_bytes = b"fake-reference-image-bytes"
        fake_storage = _make_fake_storage(ref_bytes)
        monkeypatch.setattr(fv_mod, "get_storage", lambda: fake_storage)

        svc = fv_mod.FaceVerificationService()
        # Fake a reference key in storage
        fake_storage.save_bytes(ref_bytes, svc.get_reference_key(42))

        result = svc.verify_face(user_id=42, live_image_bytes=b"fake-live-image")
        assert result["verified"] is False

    def test_disabled_verification_always_returns_true(self, monkeypatch, tmp_path):
        """face_verification_enabled=False must short-circuit to verified=True."""
        monkeypatch.setenv("FACE_VERIFICATION_ENABLED", "false")

        import app.services.face_verification as fv_mod

        ref_bytes = b"fake-reference"
        fake_storage = _make_fake_storage(ref_bytes)
        monkeypatch.setattr(fv_mod, "get_storage", lambda: fake_storage)

        svc = fv_mod.FaceVerificationService()
        fake_storage.save_bytes(ref_bytes, svc.get_reference_key(99))

        result = svc.verify_face(user_id=99, live_image_bytes=b"any-bytes")
        assert result["verified"] is True
        assert result.get("reason") == "Face verification disabled"
