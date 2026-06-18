"""Simple in-memory sliding-window rate limiter.

Limits are tracked per Gunicorn worker process, so the effective global
limit is roughly ``limit * worker_count``. That is acceptable for the goal
here: stopping credential brute force and request floods, not precise
quota accounting.
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from ..core.config import Settings


class SlidingWindowRateLimiter:
    def __init__(self):
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.monotonic()
        cutoff = now - window_seconds
        with self._lock:
            hits = self._hits[key]
            while hits and hits[0] < cutoff:
                hits.popleft()
            if len(hits) >= limit:
                return False
            hits.append(now)
            return True

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


rate_limiter = SlidingWindowRateLimiter()


def _client_ip(request: Request) -> str:
    # Behind Nginx the real client IP is in X-Forwarded-For
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(scope: str, limit: int, window_seconds: int = 60):
    """FastAPI dependency factory: limit requests per client IP for a scope."""

    def dependency(request: Request) -> None:
        if not Settings().rate_limit_enabled:
            return
        key = f"{scope}:{_client_ip(request)}"
        if not rate_limiter.allow(key, limit, window_seconds):
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please wait a moment and try again.",
            )

    return dependency
