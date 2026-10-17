from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.servico_controller import ServiceController
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.service_schema import (
    ServiceCreate,
    ServiceResponse,
    ServiceUpdate,
)
from src.security import get_current_employee

router = APIRouter(prefix="/servicos", tags=["Serviços"])


@router.post(
    "",
    response_model=ServiceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_service(
    data: ServiceCreate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await ServiceController.create(
        data, session, current_employee
    )


@router.get("", response_model=list[ServiceResponse])
async def list_services(
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await ServiceController.list(
        session, current_employee
    )


@router.patch("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: int,
    data: ServiceUpdate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await ServiceController.update(
        service_id, data, session, current_employee
    )
