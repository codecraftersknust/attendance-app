from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.routers import api_router
from .core.logging_middleware import RequestIDLoggingMiddleware
from .core.security_headers_middleware import SecurityHeadersMiddleware
from .core.config import Settings
#from app.api.v1.routers import students

app = FastAPI(title="attendance-app-backend", version="0.1.0")

app.include_router(api_router, prefix="/api/v1")

from .db.base import Base
from .db.session import engine

# Dev-only: create tables if they do not exist
Base.metadata.create_all(bind=engine)

settings = Settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_allow_origins.split(",") if o.strip()],
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=[m.strip() for m in settings.cors_allow_methods.split(",") if m.strip()],
    allow_headers=[h.strip() for h in settings.cors_allow_headers.split(",") if h.strip()],
)

app.add_middleware(RequestIDLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

app.mount("/static", StaticFiles(directory="uploads"), name="static")
