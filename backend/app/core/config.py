from pydantic_settings import BaseSettings, SettingsConfigDict


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
    face_threshold: float | None = 0.6
    face_detector_backend: str = "retinaface"
    face_worker_poll_seconds: float = 1.0

    # SQLAlchemy pool (per Gunicorn worker process)
    db_pool_size: int = 10
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_pool_recycle: int = 300

