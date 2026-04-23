#!/usr/bin/env python3
"""Unified production reset: clears DB tables, empties storage, seeds admin."""
import os
import sys
import httpx
import asyncio
import subprocess

# Add backend to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.core.config import Settings
from app.db.session import engine, Base, SessionLocal
from app.db.base import *  # Import all models to ensure metadata is populated
from app.models.user import User, UserRole
from app.models.school_settings import SchoolSettings
from app.services.security import get_password_hash

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
            [sys.executable, '-m', 'alembic', 'stamp', 'head'],
            cwd=backend_dir,
            capture_output=True,
            text=True
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
        print(f"✓ School settings initialised (2025/2026, 1st Semester)")
    except Exception as e:
        db.rollback()
        print(f"✗ Failed to seed admin: {e}")
        raise
    finally:
        db.close()


async def clear_storage():
    print("\n--- Storage Cleanup ---")
    bucket = settings.supabase_storage_bucket
    url = settings.supabase_url
    key = settings.supabase_service_role_key

    if not url or not key:
        print("⚠ Supabase credentials missing, skipping storage cleanup.")
        return

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    list_url = f"{url}/storage/v1/object/list/{bucket}"
    delete_url = f"{url}/storage/v1/object/{bucket}"

    async with httpx.AsyncClient() as client:
        folders_to_check = ["", "face_references", "selfies"]

        for folder in folders_to_check:
            print(f"Checking folder: '{folder}'...")
            try:
                resp = await client.post(
                    list_url,
                    headers=headers,
                    json={"prefix": folder, "limit": 1000}
                )

                if resp.status_code != 200:
                    print(f"  ⚠ Failed to list files in '{folder}': {resp.text}")
                    continue

                files = resp.json()
                if not files:
                    print(f"  Empty.")
                    continue

                file_paths = [f"{folder}/{f['name']}".strip("/") for f in files if "id" in f]

                if not file_paths:
                    print(f"  No files found (only folders).")
                    continue

                print(f"  Deleting {len(file_paths)} files...")
                del_resp = await client.request(
                    "DELETE",
                    delete_url,
                    headers=headers,
                    json={"prefixes": file_paths}
                )

                if del_resp.status_code == 200:
                    print(f"  ✓ Deleted files in '{folder}'.")
                else:
                    print(f"  ⚠ Failed to delete: {del_resp.text}")

            except Exception as e:
                print(f"  ⚠ Error clearing '{folder}': {e}")


async def main():
    reset_db()
    await clear_storage()
    seed_admin()
    print("\n✓ Production reset complete.")
    print(f"  Admin login: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")


if __name__ == "__main__":
    if "--confirm" not in sys.argv:
        print("CRITICAL: This will PERMANENTLY DELETE all data and files.")
        print("Run with --confirm to proceed.")
        sys.exit(1)

    asyncio.run(main())
