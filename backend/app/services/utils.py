import secrets
import string
import hashlib
from datetime import datetime, timezone
from pathlib import Path


def utcnow() -> datetime:
    """Return the current UTC time as a timezone-aware datetime.

    Supabase PostgreSQL stores timezone-aware timestamps. Using
    ``datetime.utcnow()`` returns a naive datetime which can't be
    compared with the DB values. This helper ensures consistency.
    """
    return datetime.now(timezone.utc)


def generate_session_code(length: int = 6) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def ensure_dir(path: str | Path) -> Path:
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def generate_session_nonce(length: int = 24) -> str:
    """Generate a URL-safe nonce for QR payloads."""
    # Use a restricted alphabet for easier QR decoding if needed
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def hash_device_id(device_id: str) -> str:
    """Hash device ID using SHA-256 for secure storage."""
    return hashlib.sha256(device_id.encode('utf-8')).hexdigest()
