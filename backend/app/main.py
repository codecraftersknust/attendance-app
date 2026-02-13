from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .api.v1.routers import api_router
from .core.logging_middleware import RequestIDLoggingMiddleware
from .core.security_headers_middleware import SecurityHeadersMiddleware
from .core.config import Settings
from .services.qr_rotation import stop_qr_rotation


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - QR rotation service starts lazily when first session is created
    yield
    # Shutdown - stop QR rotation service if running
    await stop_qr_rotation()


app = FastAPI(title="absense-backend", version="0.1.0", lifespan=lifespan)

app.include_router(api_router, prefix="/api/v1")

# Tables are managed by Alembic migrations / init_supabase script.
# No create_all() here — it would force a DB connection at startup
# and crash the app if the network is momentarily unavailable.

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
