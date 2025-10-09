import secrets
import string
from pathlib import Path


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
