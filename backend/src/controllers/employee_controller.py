from http import HTTPStatus

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.employee_schema import (
    EmployeeSchema,
)
from src.services.employee_service import EmployeeService

service = EmployeeService()


async def get_employees(
    limit: int,
    offset: int,
    session: AsyncSession,
    current_employee: Employee,
):
    employees = await service.get_employees(
        session,
        limit,
        offset,
        current_employee,
    )

    return {'employees': employees}


async def create_employee(
    employee: EmployeeSchema,
    session: AsyncSession,
    current_employee: Employee,
):
    try:
        return await service.create_employee(
            session,
            employee,
            current_employee,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=HTTPStatus.CONFLICT,
            detail=str(error),
        ) from None


async def update_employee(
    employee_id: int,
    employee: EmployeeSchema,
    session: AsyncSession,
    current_employee: Employee,
):
    try:
        return await service.update_employee(
            session,
            employee_id,
            employee,
            current_employee,
        )

    except IntegrityError:
        raise HTTPException(
            status_code=HTTPStatus.CONFLICT,
            detail='employeename or email already registered',
        ) from None


async def delete_employee(
    employee_id: int,
    session: AsyncSession,
    current_employee: Employee,
):
    await service.delete_employee(
        session,
        employee_id,
        current_employee,
    )
