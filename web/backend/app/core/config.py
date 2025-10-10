from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Absense Backend"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"
    database_url: str = "sqlite:///./absense_dev.db"
    storage_backend: str = "local"  # local or s3
    s3_bucket: str | None = None
    s3_region: str | None = None
    s3_access_key: str | None = None
    s3_secret_key: str | None = None
    cors_allow_origins: str = "*"  # comma-separated
    cors_allow_credentials: bool = True
    cors_allow_methods: str = "*"
    cors_allow_headers: str = "*"
    upload_max_image_mb: int = 5
    upload_allowed_image_types: str = "image/jpeg,image/png"

    # Face verification settings
    face_verification_enabled: bool = True
    face_model: str = "Facenet512"
    face_threshold: float = 0.8

    class Config:
        env_file = ".env"
