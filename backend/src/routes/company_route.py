from http import HTTPStatus
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.company_controller import CompanyController
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.company_schema import (
    CompanyCreate,
    CompanyFilter,
    CompanyResponse,
)
from src.security import get_current_employee

router = APIRouter(
    prefix='/companies',
    tags=['Companies'],
)


@router.post(
    '/',
    status_code=HTTPStatus.CREATED,
    response_model=CompanyResponse,
)
async def create_company(
    data: CompanyCreate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await CompanyController.create(data, session, current_employee)


@router.get('/', response_model=list[CompanyResponse])
async def get_companies(
    filters: Annotated[CompanyFilter, Query()],
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await CompanyController.get_all(session, current_employee, filters)


@router.get('/{company_id}', response_model=CompanyResponse)
async def get_company(
    company_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await CompanyController.get_by_id(
        company_id, session, current_employee
    )
