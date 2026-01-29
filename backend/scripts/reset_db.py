#!/usr/bin/env python3
"""Reset database by creating all tables from SQLAlchemy models and stamping alembic"""
import os
import sys
import subprocess

# Add backend to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.db.session import engine, Base
from app.db.base import *  # Import all models

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("Creating all tables from models...")
Base.metadata.create_all(bind=engine)

print("✓ Database tables created successfully!")

# Stamp alembic to latest revision
print("\nStamping alembic to head...")
try:
    result = subprocess.run(
        ['alembic', 'stamp', 'head'],
        cwd=backend_dir,
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        print("✓ Alembic stamped successfully!")
    else:
        print(f"⚠ Alembic stamp failed: {result.stderr}")
        print("   You can manually run: alembic stamp head")
except Exception as e:
    print(f"⚠ Could not stamp alembic automatically: {e}")
    print("   You can manually run: alembic stamp head")
