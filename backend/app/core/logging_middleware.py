import time
import uuid
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestIDLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())
        start = time.time()
        response: Response | None = None
        try:
            response = await call_next(request)
            return response
        finally:
            duration_ms = int((time.time() - start) * 1000)
            path = request.url.path
            method = request.method
            status = getattr(response, "status_code", 500)
            print(f"req_id={request_id} {method} {path} status={status} duration_ms={duration_ms}")
            if response is not None:
                response.headers["X-Request-ID"] = request_id
