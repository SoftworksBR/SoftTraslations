from fastapi import APIRouter, Depends

from src.security import get_current_employee

from .auth_route import router as auth_route
from .employee_route import router as employee_route
from .language_route import router as language_router
from .translation_price_route import router as translation_price_router
from .service_route import router as service_router
from .path_route import router as path_route
from .project_route import router as project_route
from .quote_route import router as quote_route
from .request_route import (
    protected_router as request_protected_route,
)
from .request_route import public_router as request_public_route
from .stage_route import router as stage_route

public_router = APIRouter()
protected_router = APIRouter(
    dependencies=[Depends(get_current_employee)],
)

public_router.include_router(auth_route)
public_router.include_router(request_public_route)
protected_router.include_router(employee_route)
protected_router.include_router(language_router)
protected_router.include_router(service_router)
protected_router.include_router(translation_price_router)
protected_router.include_router(path_route)
protected_router.include_router(project_route)
protected_router.include_router(stage_route)
protected_router.include_router(quote_route)
protected_router.include_router(request_protected_route)
