from fastapi import APIRouter, Depends

from src.security import get_current_employee

from .auth_route import router as auth_route
from .employee_route import router as employee_route
from .project_route import router as project_route
from .stage_route import router as stage_route

public_router = APIRouter()
protected_router = APIRouter(
    dependencies=[Depends(get_current_employee)],
)

public_router.include_router(auth_route)
protected_router.include_router(employee_route)
protected_router.include_router(project_route)
protected_router.include_router(stage_route)