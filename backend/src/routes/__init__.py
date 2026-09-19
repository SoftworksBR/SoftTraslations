from fastapi import APIRouter

from .auth_route import router as auth_route
from .project_route import router as project_route
from .employee_route import router as employee_route

router = APIRouter()

router.include_router(auth_route)
router.include_router(employee_route)
router.include_router(project_route)
