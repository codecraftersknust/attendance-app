from typing import Protocol

from ..core.config import Settings


class Storage(Protocol):
    def save_bytes(self, data: bytes, path: str) -> str:
        ...

    def delete(self, path: str) -> None:
        ...

    def url_for(self, path: str) -> str:
        ...

    def download_bytes(self, path: str) -> bytes:
        ...

    def exists(self, path: str) -> bool:
        ...


def get_storage() -> Storage:
    from .local import LocalStorage

    return LocalStorage()
