from urllib.parse import urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict


def upload_mount_path_from_prefix(prefix: str) -> str:
    """FastAPI mount path only (must start with /)."""
    p = prefix.strip().rstrip("/")
    if p.startswith("http://") or p.startswith("https://"):
        path = urlparse(p).path.rstrip("/") or "/uploads"
        return path if path.startswith("/") else f"/{path}"
    return p if p.startswith("/") else f"/{p}"


def upload_public_base_from_prefix(prefix: str) -> str:
    """Base URL or path prefix used in stored file URLs."""
    return prefix.strip().rstrip("/") or "/uploads"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    app_name: str = "Absense Backend"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"
    database_url: str = "sqlite:///./absense_dev.db"

    # Local file storage (selfies + reference faces)
    upload_dir: str = "./data/uploads"
    upload_public_url_prefix: str = "/uploads"

    cors_allow_origins: str = "*"  # comma-separated
    cors_allow_credentials: bool = True
    cors_allow_methods: str = "*"
    cors_allow_headers: str = "*"
    upload_max_image_mb: int = 5
    upload_allowed_image_types: str = "image/jpeg,image/png,image/jpg"

    # Face verification settings
    face_verification_enabled: bool = True
    face_model: str = "Facenet512"
    # None = use DeepFace's own per-model default (Facenet512 ≈ 0.30 cosine).
    # Do NOT set this to a high value like 0.6 — DeepFace distance is in [0,1]
    # where 0 = identical and 1 = completely different, so 0.6 accepts nearly
    # any two faces. Leave as None unless you have a specific tuned value.
    face_threshold: float | None = None
    face_detector_backend: str = "retinaface"
    face_worker_poll_seconds: float = 1.0

    # SQLAlchemy pool (per Gunicorn worker process)
    db_pool_size: int = 10
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_pool_recycle: int = 300

    def upload_mount_path(self) -> str:
        return upload_mount_path_from_prefix(self.upload_public_url_prefix)

    def upload_public_base(self) -> str:
        return upload_public_base_from_prefix(self.upload_public_url_prefix)

