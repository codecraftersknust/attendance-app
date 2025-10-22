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
from app.models.course import Course
from app.services.security import get_password_hash

def seed_data():
    db = SessionLocal()
    try:
        # Create admin user
        admin = db.query(User).filter(User.email == "admin@absense.com").first()
        if not admin:
            admin = User(
                email="admin@absense.com",
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                role=UserRole.admin,
                is_active=True
            )
            db.add(admin)
            print("Created admin user")

        # Create sample lecturer
        lecturer = db.query(User).filter(User.email == "lecturer@absense.com").first()
        if not lecturer:
            lecturer = User(
                email="lecturer@absense.com",
                hashed_password=get_password_hash("lecturer123"),
                full_name="Sample Lecturer",
                role=UserRole.lecturer,
                is_active=True
            )
            db.add(lecturer)
            print("Created lecturer user")

        # Create sample student
        student = db.query(User).filter(User.email == "student@absense.com").first()
        if not student:
            student = User(
                email="student@absense.com",
                student_id="STU001",
                hashed_password=get_password_hash("student123"),
                full_name="Sample Student",
                role=UserRole.student,
                is_active=True
            )
            db.add(student)
            print("Created student user")

        db.commit()
        
        # Create sample courses for the lecturer
        if lecturer:
            # Check if courses already exist
            existing_courses = db.query(Course).filter(Course.lecturer_id == lecturer.id).count()
            if existing_courses == 0:
                courses = [
                    Course(
                        code="CS101",
                        name="Introduction to Computer Science",
                        description="Fundamental concepts of computer science and programming",
                        semester="Fall 2024",
                        lecturer_id=lecturer.id,
                        is_active=True
                    ),
                    Course(
                        code="MATH201",
                        name="Calculus I",
                        description="Differential and integral calculus",
                        semester="Fall 2024",
                        lecturer_id=lecturer.id,
                        is_active=True
                    ),
                    Course(
                        code="PHYS101",
                        name="General Physics",
                        description="Mechanics, thermodynamics, and waves",
                        semester="Fall 2024",
                        lecturer_id=lecturer.id,
                        is_active=True
                    ),
                    Course(
                        code="ENG101",
                        name="English Composition",
                        description="Academic writing and communication skills",
                        semester="Fall 2024",
                        lecturer_id=lecturer.id,
                        is_active=True
                    )
                ]
                
                for course in courses:
                    db.add(course)
                print("Created sample courses")
        
        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
