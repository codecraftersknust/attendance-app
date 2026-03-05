#!/usr/bin/env python3
"""Create the initial production admin user."""
import os
import sys

# Add backend to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.db.session import SessionLocal
from app.db.base import *  # Ensure all models are loaded for relationships
from app.services.security import get_password_hash

def create_admin():
    email = "admin@absense.com"
    password = "Coe@attend26"
    full_name = "System Admin"
    
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User {email} already exists.")
            return

        admin_user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            role=UserRole.admin,
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        print(f"✓ Admin user {email} created successfully!")
    except Exception as e:
        db.rollback()
        print(f"⚠ Failed to create admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
