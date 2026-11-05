from http import HTTPStatus

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.company_schema import (
    CompanyCreate,
    CompanyResponse,
    PersonCreate,
    PersonResponse,
)
from src.security import get_current_employee
from src.services.company_service import CompanyService

router = APIRouter(tags=['Customers'])


@router.post(
    '/companies/',
    status_code=HTTPStatus.CREATED,
    response_model=CompanyResponse,
)
async def create_company(
    data: CompanyCreate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await CompanyService(session).create_company(data, current_employee)


@router.get('/companies/', response_model=list[CompanyResponse])
async def list_companies(
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await CompanyService(session).list_companies(current_employee)


@router.get('/companies/{company_id}', response_model=CompanyResponse)
async def get_company(
    company_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await CompanyService(session).get_company(
        company_id, current_employee
    )


@router.post(
    '/people/',
    status_code=HTTPStatus.CREATED,
    response_model=PersonResponse,
)
async def create_person(
    data: PersonCreate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await CompanyService(session).create_person(data, current_employee)


@router.get('/people/', response_model=list[PersonResponse])
async def list_people(
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await CompanyService(session).list_people(current_employee)
