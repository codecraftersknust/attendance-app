"""Lightweight face enrollment checks (no DeepFace import)."""

from ..models.user import User
from ..storage.base import get_storage


def has_face_enrolled(user: User) -> bool:
    if not user.face_reference_path:
        return False
    return get_storage().exists(user.face_reference_path)
