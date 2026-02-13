from typing import Protocol


class Storage(Protocol):
    def save_bytes(self, data: bytes, path: str) -> str:
        ...

    def delete(self, path: str) -> None:
        ...

    def url_for(self, path: str) -> str:
        ...

    def download_bytes(self, path: str) -> bytes:
        ...


def get_storage() -> Storage:
    from .supabase import SupabaseStorage
    return SupabaseStorage()
