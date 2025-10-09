from typing import Protocol
from pathlib import Path


class Storage(Protocol):
    def save_bytes(self, data: bytes, path: str) -> str:
        ...

    def url_for(self, path: str) -> str:
        ...


def get_storage():
    from ..core.config import Settings
    settings = Settings()
    if settings.storage_backend == "s3":
        from .s3 import S3Storage
        return S3Storage(
            bucket=settings.s3_bucket or "",
            region=settings.s3_region or "",
            access_key=settings.s3_access_key,
            secret_key=settings.s3_secret_key,
        )
    else:
        from .local import LocalStorage
        return LocalStorage()
