#!/usr/bin/env python3
"""Unified production reset: clears DB tables, empties local uploads, seeds admin."""
import os
import sys
import subprocess

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.core.config import Settings
from app.db.session import engine, Base, SessionLocal
from app.db.base import *  # noqa: F401,F403 — register models
from app.models.user import User, UserRole
from app.models.school_settings import SchoolSettings
from app.services.security import get_password_hash
from app.storage.base import get_storage

settings = Settings()

ADMIN_EMAIL = "admin@absense.com"
ADMIN_PASSWORD = "Coe@attend26"
ADMIN_NAME = "System Administrator"


def reset_db():
    print("--- Database Reset ---")
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)

    print("Creating all tables from models...")
    Base.metadata.create_all(bind=engine)

    print("✓ Database tables reset successfully!")

    print("\nStamping alembic to head...")
    try:
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "stamp", "head"],
            cwd=backend_dir,
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            print("✓ Alembic stamped successfully!")
        else:
            print(f"⚠ Alembic stamp failed: {result.stderr}")
    except Exception as e:
        print(f"⚠ Could not stamp alembic: {e}")


def seed_admin():
    print("\n--- Seeding Admin User ---")
    db = SessionLocal()
    try:
        admin = User(
            email=ADMIN_EMAIL,
            hashed_password=get_password_hash(ADMIN_PASSWORD),
            full_name=ADMIN_NAME,
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)

        school_settings = SchoolSettings(
            id=1,
            current_semester="1st Semester",
            is_on_break=False,
            enrollment_open=True,
            academic_year="2025/2026",
        )
        db.add(school_settings)

        db.commit()
        print(f"✓ Admin user created: {ADMIN_EMAIL}")
        print("✓ School settings initialised (2025/2026, 1st Semester)")
    except Exception as e:
        db.rollback()
        print(f"✗ Failed to seed admin: {e}")
        raise
    finally:
        db.close()


def clear_storage():
    print("\n--- Local Storage Cleanup ---")
    try:
        storage = get_storage()
        storage.clear_all()
        print(f"✓ Cleared upload directory: {settings.upload_dir}")
    except AttributeError:
        print("⚠ Storage backend has no clear_all(); remove files manually.")


def main():
    reset_db()
    clear_storage()
    seed_admin()
    print("\n✓ Production reset complete.")
    print(f"  Admin login: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")


if __name__ == "__main__":
    if "--confirm" not in sys.argv:
        print("CRITICAL: This will PERMANENTLY DELETE all data and files.")
        print("Run with --confirm to proceed.")
        sys.exit(1)

    main()
