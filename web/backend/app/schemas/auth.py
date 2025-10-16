from pydantic import BaseModel, EmailStr
from typing import Optional


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
    student_id: Optional[str] = None
    role: str = "student"


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    student_id: Optional[str] = None
    role: str

    class Config:
        from_attributes = True
