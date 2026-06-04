import os
from pathlib import Path

from ..core.config import Settings


class LocalStorage:
    """File storage on the application server disk."""

    def __init__(self) -> None:
        settings = Settings()
        self.root = Path(settings.upload_dir).resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self._url_prefix = settings.upload_public_base()

    def _full_path(self, path: str) -> Path:
        full = (self.root / path).resolve()
        if not str(full).startswith(str(self.root)):
            raise ValueError("Invalid storage path")
        return full

    def save_bytes(self, data: bytes, path: str) -> str:
        full = self._full_path(path)
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_bytes(data)
        return path

    def delete(self, path: str) -> None:
        full = self._full_path(path)
        if full.is_file():
            full.unlink()

    def url_for(self, path: str) -> str:
        return f"{self._url_prefix}/{path.lstrip('/')}"

    def download_bytes(self, path: str) -> bytes:
        return self._full_path(path).read_bytes()

    def exists(self, path: str) -> bool:
        return self._full_path(path).is_file()

    def clear_all(self) -> None:
        """Remove all files under the upload root (used by reset scripts)."""
        if not self.root.exists():
            return
        for child in self.root.rglob("*"):
            if child.is_file():
                child.unlink()
