from pydantic import BaseModel

class FaceVerificationResponse(BaseModel):
    verified: bool
    distance: float | None = None
    threshold: float | None = None
    model: str | None = None
    error: str | None = None
