from pydantic import BaseModel, Field
from typing import List, Optional


class CourseCreate(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=200)
    semester: str = Field(min_length=1, max_length=20)
    description: Optional[str] = Field(default=None, max_length=500)
    level: int = 100
    programmes: List[str] = Field(default_factory=lambda: ["General"])


class CourseUpdate(BaseModel):
    code: Optional[str] = Field(default=None, max_length=20)
    name: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=500)
    semester: Optional[str] = Field(default=None, max_length=20)
    level: Optional[int] = None
    programmes: Optional[List[str]] = None
    is_active: Optional[bool] = None


class DeviceResetApprove(BaseModel):
    user_id: int
    new_device_id: str = Field(min_length=1)


class ProgrammeCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
