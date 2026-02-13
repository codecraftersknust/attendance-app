import httpx
from .base import Storage
from ..core.config import Settings


class SupabaseStorage(Storage):
    """File storage backed by Supabase Storage (S3-compatible under the hood)."""

    def __init__(self) -> None:
        settings = Settings()
        self.base_url = settings.supabase_url.rstrip("/")
        self.bucket = settings.supabase_storage_bucket
        self.headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
        }

    # ── internal helpers ────────────────────────────────────────────
    def _storage_url(self, path: str) -> str:
        """Build the Supabase Storage REST API URL for a given object path."""
        return f"{self.base_url}/storage/v1/object/{self.bucket}/{path}"

    @staticmethod
    def _content_type(path: str) -> str:
        if path.lower().endswith(".png"):
            return "image/png"
        return "image/jpeg"

    # ── public interface ────────────────────────────────────────────
    def save_bytes(self, data: bytes, path: str) -> str:
        """Upload *data* to Supabase Storage and return the relative path."""
        url = self._storage_url(path)
        headers = {
            **self.headers,
            "Content-Type": self._content_type(path),
            "x-upsert": "true",  # overwrite if exists
        }
        resp = httpx.post(url, content=data, headers=headers, timeout=30)
        resp.raise_for_status()
        return path  # return the relative path (used as key everywhere)

    def delete(self, path: str) -> None:
        """Delete a file from Supabase Storage."""
        url = f"{self.base_url}/storage/v1/object/{self.bucket}"
        resp = httpx.delete(
            url,
            headers={**self.headers, "Content-Type": "application/json"},
            json={"prefixes": [path]},
            timeout=15,
        )
        resp.raise_for_status()

    def url_for(self, path: str) -> str:
        """Return a public URL for the file.

        Uses the Supabase public URL endpoint. The bucket must have public
        access enabled, or the URL will 403. For private buckets, switch to
        ``create_signed_url`` instead.
        """
        return f"{self.base_url}/storage/v1/object/public/{self.bucket}/{path}"

    def download_bytes(self, path: str) -> bytes:
        """Download file bytes — used by face verification to get reference images."""
        url = self._storage_url(path)
        resp = httpx.get(url, headers=self.headers, timeout=30)
        resp.raise_for_status()
        return resp.content
