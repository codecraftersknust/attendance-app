from fastapi import APIRouter

api_router = APIRouter()

from .health import router as health_router

api_router.include_router(health_router)

from .auth import router as auth_router
api_router.include_router(auth_router)

from .lecturer import router as lecturer_router
api_router.include_router(lecturer_router)

from .student import router as student_router
api_router.include_router(student_router)

from .admin import router as admin_router
api_router.include_router(admin_router)
