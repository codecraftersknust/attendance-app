import os
import tempfile
from typing import Any, Dict

try:
    from deepface import DeepFace  # type: ignore
    _DEEPFACE_AVAILABLE = True
except Exception:  # pragma: no cover
    DeepFace = None  # type: ignore
    _DEEPFACE_AVAILABLE = False

from app.core.config import Settings
from app.storage.base import get_storage


class FaceVerificationService:
    """Face enrolment and verification using local disk storage for persistence."""

    FACES_PREFIX = "faces"

    def get_reference_key(self, user_id: int) -> str:
        """Return the storage object key for a user's reference face."""
        return f"{self.FACES_PREFIX}/{user_id}_reference.jpg"

    def save_reference_face(self, user_id: int, image_bytes: bytes) -> str:
        """Upload reference face bytes to storage and return the key."""
        storage = get_storage()
        key = self.get_reference_key(user_id)
        storage.save_bytes(image_bytes, key)
        return key

    def has_reference_face(self, user_id: int) -> bool:
        """Check if a reference face actually exists in remote storage."""
        storage = get_storage()
        return storage.exists(self.get_reference_key(user_id))

    def verify_face(self, user_id: int, live_image_bytes: bytes) -> Dict[str, Any]:
        """Compare uploaded face bytes with the stored reference.

        Both images are written to temp files for DeepFace / PIL, then
        cleaned up automatically.
        """
        storage = get_storage()
        ref_key = self.get_reference_key(user_id)

        # Download reference image from storage
        try:
            ref_bytes = storage.download_bytes(ref_key)
        except Exception:
            return {"verified": False, "reason": "No reference image found"}

        cfg = Settings()
        if not cfg.face_verification_enabled:
            return {"verified": True, "reason": "Face verification disabled"}

        # Write both images to temp files so image libraries can open them
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as ref_f:
            ref_f.write(ref_bytes)
            ref_path = ref_f.name
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as live_f:
            live_f.write(live_image_bytes)
            live_path = live_f.name

        try:
            return self._run_verification(cfg, live_path, ref_path)
        finally:
            # Always clean up temp files
            for p in (ref_path, live_path):
                try:
                    os.remove(p)
                except OSError:
                    pass

    # ── internal ────────────────────────────────────────────────────
    @staticmethod
    def _run_verification(cfg: Settings, live_path: str, ref_path: str) -> Dict[str, Any]:
        """Run face comparison using DeepFace. Fail closed if unavailable."""

        if not _DEEPFACE_AVAILABLE:
            return {
                "verified": False,
                "error": "Face engine unavailable (DeepFace not installed)",
                "model": "unavailable",
            }

        try:
            result = DeepFace.verify(
                img1_path=live_path,
                img2_path=ref_path,
                model_name=cfg.face_model,
                detector_backend=getattr(cfg, "face_detector_backend", "retinaface"),
                enforce_detection=True,
            )

            verified = bool(result.get("verified"))
            distance = float(result.get("distance", 0.0))
            threshold = float(result.get("threshold", distance + 1.0))
            model = str(result.get("model", cfg.face_model))

            if cfg.face_threshold is not None:
                verified = distance <= cfg.face_threshold
                threshold = cfg.face_threshold

            return {
                "verified": verified,
                "distance": distance,
                "threshold": threshold,
                "model": model,
            }
        except Exception as e:  # pragma: no cover
            return {"verified": False, "error": str(e)}
