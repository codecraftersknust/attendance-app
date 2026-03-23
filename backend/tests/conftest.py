import os
import sys
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


# ── Path setup (done once at import time so all test modules can import app) ──
_root = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.abspath(os.path.join(_root, ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)


class _FakeStorage:
    """In-memory storage — avoids any network/Supabase calls during tests."""

    def __init__(self):
        self._store: dict[str, bytes] = {}

    def save_bytes(self, data: bytes, key: str) -> str:
        self._store[key] = data
        return key

    def download_bytes(self, key: str) -> bytes:
        return self._store.get(key, b"fake")

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def exists(self, key: str) -> bool:
        return key in self._store

    def url_for(self, key: str) -> str:
        return f"http://fake-storage/{key}"


@pytest.fixture(autouse=True)
def _mock_storage(monkeypatch):
    """Replace Supabase storage globally with an in-memory fake for all tests."""
    fake = _FakeStorage()
    import app.storage.base
    import app.api.v1.routers.student
    import app.services.face_verification
    monkeypatch.setattr(app.storage.base, "get_storage", lambda: fake)
    monkeypatch.setattr(app.api.v1.routers.student, "get_storage", lambda: fake)
    monkeypatch.setattr(app.services.face_verification, "get_storage", lambda: fake)
    yield


@pytest.fixture(autouse=True)
def _set_env(tmp_path, monkeypatch):
    """
    Create a fresh SQLite engine per test and override the app's get_db dependency.
    This ensures full database isolation without relying on monkeypatch.setenv
    (which would not affect an already-imported engine).
    """
    from app.db.base import Base
    from app.db.deps import get_db
    from app.main import app

    db_path = str(tmp_path / "test.db")
    db_url = f"sqlite:///{db_path}"

    # Create a brand-new engine for this test
    test_engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        future=True,
    )
    TestSession = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)

    # Build all tables fresh
    Base.metadata.create_all(bind=test_engine)

    # Override FastAPI's get_db to use the test session
    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    yield

    # Teardown
    app.dependency_overrides.pop(get_db, None)
    test_engine.dispose()


@pytest.fixture()
def client():
    from fastapi.testclient import TestClient
    from app.main import app
    return TestClient(app)
