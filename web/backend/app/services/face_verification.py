import os
from pathlib import Path
from typing import Any, Dict, Optional
try:
    from deepface import DeepFace  # type: ignore
    _DEEPFACE_AVAILABLE = True
except Exception:  # pragma: no cover
    DeepFace = None  # type: ignore
    _DEEPFACE_AVAILABLE = False

from app.core.config import Settings

class FaceVerificationService:
    def __init__(self, base_dir="uploads/faces/"):
        self.base_dir = Path(base_dir).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def get_reference_path(self, user_id: int) -> str:
        """Get the reference path for a user (returns absolute path)."""
        ref_path = self.base_dir / f"{user_id}_reference.jpg"
        return str(ref_path.resolve())

    def save_reference_face(self, user_id: int, temp_path: str) -> str:
        """Save student's reference face permanently. Returns absolute path."""
        ref_path = self.get_reference_path(user_id)
        # Ensure temp_path is absolute
        temp_abs = Path(temp_path).resolve()
        ref_abs = Path(ref_path).resolve()
        # Ensure parent directory exists
        ref_abs.parent.mkdir(parents=True, exist_ok=True)
        # Move the file
        if temp_abs.exists():
            temp_abs.replace(ref_abs)
        else:
            raise FileNotFoundError(f"Temporary file not found: {temp_path}")
        # Return absolute path
        return str(ref_abs)

    def verify_face(self, user_id: int, live_image_path: str, reference_path: Optional[str] = None) -> Dict[str, Any]:
        """Compare uploaded face with stored reference.
        
        Args:
            user_id: User ID
            live_image_path: Path to the live image to verify
            reference_path: Optional path to reference image. If not provided, uses get_reference_path(user_id)
        """
        # Use provided reference path or construct from user_id
        if reference_path:
            ref_path = Path(reference_path).resolve()
        else:
            ref_path = Path(self.get_reference_path(user_id))
        
        if not ref_path.exists():
            return {"verified": False, "reason": f"No reference image found at {ref_path}"}
        
        # Ensure live image path is absolute
        live_path = Path(live_image_path).resolve()
        if not live_path.exists():
            return {"verified": False, "reason": f"Live image not found at {live_image_path}"}

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
                img1 = Image.open(str(live_path)).convert("L").resize((160, 160))
                img2 = Image.open(str(ref_path)).convert("L").resize((160, 160))
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
                img1_path=str(live_path),
                img2_path=str(ref_path),
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
