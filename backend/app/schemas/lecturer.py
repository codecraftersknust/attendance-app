from pydantic import BaseModel
from typing import Optional


class QRLocation(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_m: Optional[int] = None


class QRPayload(BaseModel):
    session_id: int
    nonce: str
    expires_at: str
    lecturer_name: Optional[str] = None
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    location: Optional[QRLocation] = None
    session_code: Optional[str] = None


class QRStatusResponse(BaseModel):
    has_qr: bool
    expires_at: Optional[str]
    seconds_remaining: int
    is_expired: bool
    next_rotation_in: Optional[int] = None


class QRDisplayResponse(BaseModel):
    session_id: int
    session_code: str
    qr_payload: QRPayload
    qr_data: str
    expires_at: str
    time_remaining_seconds: int
    is_expired: bool
    lecturer_name: Optional[str] = None
    session_ends_at: Optional[str] = None

