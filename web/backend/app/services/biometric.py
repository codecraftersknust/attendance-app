from typing import Optional

class BiometricService:
    def check_liveness(self, selfie_bytes: bytes) -> bool:
        # TODO: integrate real liveness (TFLite/OpenCV)
        return True

    def match_face(self, reference_bytes: bytes, selfie_bytes: bytes, threshold: float = 0.8) -> bool:
        # TODO: integrate real face matching; stub returns True
        return True
