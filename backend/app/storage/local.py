from pathlib import Path
from .base import Storage
from ..core.config import Settings


class LocalStorage(Storage):
    def __init__(self, root: str = "uploads", base_url: str = "/static") -> None:
        self.root = Path(root)
        self.base_url = base_url.rstrip("/")
        self.root.mkdir(parents=True, exist_ok=True)

    def save_bytes(self, data: bytes, path: str) -> str:
        full_path = self.root / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_bytes(data)
        return str(full_path)

    def url_for(self, path: str) -> str:
        return f"{self.base_url}/{path}"
