import secrets
import string
import hashlib
from datetime import datetime, timezone
from pathlib import Path


def utcnow() -> datetime:
    """Return the current UTC time as a timezone-aware datetime.

    PostgreSQL stores timezone-aware timestamps. Using ``datetime.utcnow()``
    returns a naive datetime which can't be compared with DB values.
    """
    return datetime.now(timezone.utc)


def to_utc_iso(dt: datetime | None) -> str | None:
    """Serialize a datetime as an ISO-8601 string with an explicit UTC offset.

    Naive datetimes (e.g. read back from SQLite) are stored as UTC wall time,
    so we attach UTC instead of letting clients guess the timezone. Without an
    offset, JavaScript's ``new Date()`` parses the string as *local* time,
    which skews countdowns by the client's UTC offset.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def seconds_until(dt: datetime | None) -> int | None:
    """Seconds from now until ``dt`` (negative if in the past). Naive-safe."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return int((dt - utcnow()).total_seconds())


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
