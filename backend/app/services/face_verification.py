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
    """Face enrolment and verification using Supabase Storage for persistence."""

    FACES_PREFIX = "faces"

    def get_reference_key(self, user_id: int) -> str:
        """Return the Supabase Storage object key for a user's reference face."""
        return f"{self.FACES_PREFIX}/{user_id}_reference.jpg"

    def save_reference_face(self, user_id: int, image_bytes: bytes) -> str:
        """Upload reference face bytes to Supabase Storage and return the key."""
        storage = get_storage()
        key = self.get_reference_key(user_id)
        storage.save_bytes(image_bytes, key)
        return key

    def has_reference_face(self, user_id: int) -> bool:
        """Check if a reference face exists in remote storage."""
        storage = get_storage()
        try:
            storage.download_bytes(self.get_reference_key(user_id))
            return True
        except Exception:
            return False

    def verify_face(self, user_id: int, live_image_bytes: bytes) -> Dict[str, Any]:
        """Compare uploaded face bytes with the stored reference.

        Both images are written to temp files for DeepFace / PIL, then
        cleaned up automatically.
        """
        storage = get_storage()
        ref_key = self.get_reference_key(user_id)

        # Download reference from Supabase Storage
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
        """Run face comparison using DeepFace or lightweight fallback."""

        if not _DEEPFACE_AVAILABLE:
            try:
                from PIL import Image
                import numpy as np
            except Exception:
                return {
                    "verified": False,
                    "error": "Face engine unavailable (DeepFace import failed)",
                }

            try:
                img1 = Image.open(live_path).convert("L").resize((160, 160))
                img2 = Image.open(ref_path).convert("L").resize((160, 160))
                v1 = np.asarray(img1, dtype=np.float32).flatten()
                v2 = np.asarray(img2, dtype=np.float32).flatten()
                v1 = (v1 - v1.mean()) / (v1.std() + 1e-6)
                v2 = (v2 - v2.mean()) / (v2.std() + 1e-6)
                sim = float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6))
                sim01 = (sim + 1.0) / 2.0
                distance = 1.0 - sim01
                verified = sim01 >= 0.60
                return {
                    "verified": verified,
                    "distance": distance,
                    "threshold": 1.0 - 0.60,
                    "model": "fallback-cosine",
                }
            except Exception as e:
                return {"verified": False, "error": f"Fallback error: {str(e)}"}

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
