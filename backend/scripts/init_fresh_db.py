#!/usr/bin/env python3
"""First-time database setup: create all tables from models, then stamp Alembic head.

Use this instead of `alembic upgrade head` on a new empty database. The legacy
migration chain assumes tables already existed and only applies ALTERs; the
initial revision (ef62afc57a01) is empty.
"""
import os
import subprocess
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.db.session import engine, Base
from app.db.base import *  # noqa: F401,F403 — register all models


def main() -> None:
    print("Creating all tables from SQLAlchemy models...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created")

    print("Stamping Alembic to head (mark migrations as applied)...")
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "stamp", "head"],
        cwd=backend_dir,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stderr or result.stdout)
        sys.exit(1)
    print("✓ Alembic stamped to head")
    print("\nNext: python scripts/create_admin.py")


if __name__ == "__main__":
    main()
