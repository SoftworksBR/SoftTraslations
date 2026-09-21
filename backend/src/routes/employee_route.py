from http import HTTPStatus

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.employee_controller import (
    create_employee,
    delete_employee,
    get_employees,
    update_employee,
)
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.employee_schema import (
    EmployeeListSchema,
    EmployeePublicSchema,
    EmployeeSchema,
)
from src.security import get_current_employee, require_roles
from src.enums.enums import Roles

router = APIRouter(
    prefix='/employee',
    tags=['Employees'],
    dependencies=[Depends(require_roles(Roles.ADMIN))],
)


@router.get(
    '/',
    status_code=HTTPStatus.OK,
    response_model=EmployeeListSchema,
)
async def get_employees_route(
    limit: int = 10,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await get_employees(
        limit,
        offset,
        session,
    )


@router.post(
    '/',
    status_code=HTTPStatus.CREATED,
    response_model=EmployeePublicSchema,
)
async def create_employee_route(
    employee: EmployeeSchema,
    session: AsyncSession = Depends(get_session),
):
    return await create_employee(
        employee,
        session,
    )


@router.put(
    '/{employee_id}',
    status_code=HTTPStatus.OK,
    response_model=EmployeePublicSchema,
)
async def update_employee_route(
    employee_id: int,
    employee: EmployeeSchema,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await update_employee(
        employee_id,
        employee,
        session,
        current_employee,
    )


@router.delete(
    '/{employee_id}',
    status_code=HTTPStatus.NO_CONTENT,
)
async def delete_employee_route(
    employee_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    await delete_employee(
        employee_id,
        session,
        current_employee,
    )
