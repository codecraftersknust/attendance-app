from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None


class TokenPayload(BaseModel):
    sub: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    user_id: Optional[str] = None
    role: str = "student"


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    user_id: Optional[str] = None
    role: str
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserProfileRead(BaseModel):
    """Extended user profile with all displayable fields."""
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    user_id: Optional[str] = None
    role: str
    is_active: bool = True
    has_face_enrolled: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Fields a user can update on their own profile."""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    user_id: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
