import os
from typing import Any, Dict, Optional
from pathlib import Path
try:
    from deepface import DeepFace  # type: ignore
    _DEEPFACE_AVAILABLE = True
except Exception:  # pragma: no cover
    DeepFace = None  # type: ignore
    _DEEPFACE_AVAILABLE = False

from app.core.config import Settings

class FaceVerificationService:
    def __init__(self, base_dir: str = "uploads/faces/"):
        # Store an absolute, canonical path so lookups stay consistent across runs
        self.base_dir = Path(base_dir).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def get_reference_path(self, user_id: int) -> str:
        return str(self.base_dir / f"{user_id}_reference.jpg")

    def save_reference_face(self, user_id: int, temp_path: str) -> str:
        """Save student's reference face permanently."""
        ref_path = self.get_reference_path(user_id)
        Path(ref_path).parent.mkdir(parents=True, exist_ok=True)
        os.replace(temp_path, ref_path)
        return ref_path

    def has_reference_face(self, user_id: int, reference_path: Optional[str] = None) -> bool:
        """Check if a reference face exists for the user."""
        ref_path = reference_path or self.get_reference_path(user_id)
        return os.path.exists(ref_path)

    def verify_face(self, user_id: int, live_image_path: str, reference_path: Optional[str] = None) -> Dict[str, Any]:
        """Compare uploaded face with stored reference."""
        ref_path = reference_path or self.get_reference_path(user_id)
        if not os.path.exists(ref_path):
            return {"verified": False, "reason": "No reference image found"}

        cfg = Settings()
        if not cfg.face_verification_enabled:
            return {"verified": True, "reason": "Face verification disabled"}

        if not _DEEPFACE_AVAILABLE:
            # Lightweight fallback using PIL + numpy cosine similarity
            try:
                from PIL import Image
                import numpy as np
            except Exception:
                return {
                    "verified": False,
                    "error": "Face engine unavailable (DeepFace import failed)",
                }

            try:
                img1 = Image.open(live_image_path).convert("L").resize((160, 160))
                img2 = Image.open(ref_path).convert("L").resize((160, 160))
                v1 = np.asarray(img1, dtype=np.float32).flatten()
                v2 = np.asarray(img2, dtype=np.float32).flatten()
                # Normalize
                v1 = (v1 - v1.mean()) / (v1.std() + 1e-6)
                v2 = (v2 - v2.mean()) / (v2.std() + 1e-6)
                # Cosine similarity in [ -1, 1 ]; map to [0,1]
                sim = float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6))
                sim01 = (sim + 1.0) / 2.0
                # When using fallback, treat "distance" as (1 - similarity)
                distance = 1.0 - sim01
                # Fallback similarity threshold (0.6); tuned to reduce false negatives
                verified = sim01 >= 0.60
                return {
                    "verified": verified,
                    "distance": distance,
                    "threshold": 1.0 - 0.60,
                    "model": "fallback-cosine",
                }
            except Exception as e:
                return {
                    "verified": False,
                    "error": f"Fallback error: {str(e)}",
                }

        try:
            result = DeepFace.verify(
                img1_path=live_image_path,
                img2_path=ref_path,
                model_name=cfg.face_model,
                detector_backend=getattr(cfg, "face_detector_backend", "retinaface"),
                enforce_detection=True,
            )

            # Enforce optional threshold override from settings
            verified = bool(result.get("verified"))
            distance = float(result.get("distance", 0.0))
            # Prefer DeepFace-provided threshold; only override if configured
            threshold = float(result.get("threshold", distance + 1.0))
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
