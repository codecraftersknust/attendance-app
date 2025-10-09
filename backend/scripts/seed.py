#!/usr/bin/env python3
"""Database seed script for initial data"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.services.security import get_password_hash

def seed_data():
    db = SessionLocal()
    try:
        # Create admin user
        admin = db.query(User).filter(User.email == "admin@smavs.com").first()
        if not admin:
            admin = User(
                email="admin@smavs.com",
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                role=UserRole.admin,
                is_active=True
            )
            db.add(admin)
            print("Created admin user")

        # Create sample lecturer
        lecturer = db.query(User).filter(User.email == "lecturer@smavs.com").first()
        if not lecturer:
            lecturer = User(
                email="lecturer@smavs.com",
                hashed_password=get_password_hash("lecturer123"),
                full_name="Sample Lecturer",
                role=UserRole.lecturer,
                is_active=True
            )
            db.add(lecturer)
            print("Created lecturer user")

        # Create sample student
        student = db.query(User).filter(User.email == "student@smavs.com").first()
        if not student:
            student = User(
                email="student@smavs.com",
                hashed_password=get_password_hash("student123"),
                full_name="Sample Student",
                role=UserRole.student,
                is_active=True
            )
            db.add(student)
            print("Created student user")

        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
