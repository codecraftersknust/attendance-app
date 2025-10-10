import os
from typing import Any, Dict
try:
    from deepface import DeepFace  # type: ignore
    _DEEPFACE_AVAILABLE = True
except Exception:  # pragma: no cover
    DeepFace = None  # type: ignore
    _DEEPFACE_AVAILABLE = False

from app.core.config import Settings

class FaceVerificationService:
    def __init__(self, base_dir="uploads/faces/"):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def get_reference_path(self, user_id: int) -> str:
        return os.path.join(self.base_dir, f"{user_id}_reference.jpg")

    def save_reference_face(self, user_id: int, temp_path: str) -> str:
        """Save student's reference face permanently."""
        ref_path = self.get_reference_path(user_id)
        os.replace(temp_path, ref_path)
        return ref_path

    def verify_face(self, user_id: int, live_image_path: str) -> Dict[str, Any]:
        """Compare uploaded face with stored reference."""
        ref_path = self.get_reference_path(user_id)
        if not os.path.exists(ref_path):
            return {"verified": False, "reason": "No reference image found"}

        cfg = Settings()
        if not cfg.face_verification_enabled:
            return {"verified": True, "reason": "Face verification disabled"}

        if not _DEEPFACE_AVAILABLE:
            # Fallback: accept but indicate missing engine
            return {
                "verified": True,
                "reason": "DeepFace not available; bypassing",
            }

        try:
            result = DeepFace.verify(
                img1_path=live_image_path,
                img2_path=ref_path,
                model_name=cfg.face_model,
                detector_backend="opencv",
                enforce_detection=False,
            )

            # Enforce optional threshold override from settings
            verified = bool(result.get("verified"))
            distance = float(result.get("distance", 0.0))
            threshold = float(result.get("threshold", cfg.face_threshold))
            model = str(result.get("model", cfg.face_model))

            # If DeepFace threshold differs, allow admin override via settings
            if cfg.face_threshold is not None:
                verified = distance <= cfg.face_threshold
                threshold = cfg.face_threshold

            return {
                "verified": verified,
                "distance": distance,
                "threshold": threshold,
                "model": model,
            }
        except Exception as e:  # pragma: no cover (depends on runtime env)
            return {"verified": False, "error": str(e)}
