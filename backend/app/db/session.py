import socket
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from ..core.config import Settings

# Force IPv4 for Python-level sockets (e.g. httpx used by Supabase storage).
# psycopg2/libpq does its own DNS at the C level so this doesn't affect DB
# connections, but the Supabase pooler hostname already has IPv4 A-records
# so libpq resolves correctly on its own.
_original_getaddrinfo = socket.getaddrinfo

def _ipv4_getaddrinfo(*args, **kwargs):
    responses = _original_getaddrinfo(*args, **kwargs)
    ipv4 = [r for r in responses if r[0] == socket.AF_INET]
    return ipv4 if ipv4 else responses

socket.getaddrinfo = _ipv4_getaddrinfo

settings = Settings()

# Build engine kwargs based on driver (SQLite doesn't support pool settings)
_engine_kwargs: dict = {"future": True}
if settings.database_url.startswith("postgresql"):
    _engine_kwargs.update(
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=300,  # recycle connections every 5 min (important for Supabase pooler)
        pool_pre_ping=True,  # verify connections are alive before using them
    )

engine = create_engine(settings.database_url, **_engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

class Base(DeclarativeBase):
    pass
