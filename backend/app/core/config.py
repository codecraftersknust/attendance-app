from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Absense Backend"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"
    database_url: str = "sqlite:///./absense_dev.db"

    # Supabase
    supabase_url: str = ""  # e.g. https://<project-ref>.supabase.co
    supabase_anon_key: str = ""  # public anon key from Supabase dashboard
    supabase_service_role_key: str = ""  # service role key (server-side only)
    supabase_storage_bucket: str = "uploads"  # bucket name in Supabase Storage

    cors_allow_origins: str = "*"  # comma-separated
    cors_allow_credentials: bool = True
    cors_allow_methods: str = "*"
    cors_allow_headers: str = "*"
    upload_max_image_mb: int = 5
    upload_allowed_image_types: str = "image/jpeg,image/png"

    # Face verification settings
    face_verification_enabled: bool = True
    face_model: str = "Facenet512"
    face_threshold: float | None = 0.6
    face_detector_backend: str = "retinaface"

    class Config:
        env_file = ".env"
