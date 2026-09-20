from http import HTTPStatus

from src.models.employee_model import Employee
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.employee_schema import (
    EmployeeSchema,
)
from src.services.employee_service import EmployeeService

service = EmployeeService()


async def get_employees(
    limit: int,
    offset: int,
    session: AsyncSession,
):
    employees = await service.get_employees(
        session,
        limit,
        offset,
    )

    return {'employees': employees}


async def create_employee(
    employee: EmployeeSchema,
    session: AsyncSession,
):
    try:
        return await service.create_employee(
            session,
            employee,
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
    if current_employee.id != employee_id:
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You can only update your own employee',
        )

    try:
        return await service.update_employee(
            session,
            current_employee,
            employee,
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
    if current_employee.id != employee_id:
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You can only delete your own employee',
        )

    await service.delete_employee(
        session,
        current_employee,
    )
