import os
import sys
import pytest

@pytest.fixture(autouse=True)
def _set_env(tmp_path, monkeypatch):
    # ensure DB and PYTHONPATH before app import
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path}/test.db")
    # point imports to backend app package
    root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.abspath(os.path.join(root, ".."))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    yield

@pytest.fixture()
def client():
    from fastapi.testclient import TestClient
    from app.main import app
    return TestClient(app)
