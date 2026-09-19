from http import HTTPStatus

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import Roles
from src.models.employee_model import Employee
from src.repositories.employee_repository import EmployeeRepository
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
    if (
        current_employee.role != Roles.ADMIN
        and current_employee.id != employee_id
    ):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You can only update your own employee',
        )

    target_employee = await EmployeeRepository.get_by_id(
        session,
        employee_id,
    )
    if target_employee is None:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND,
            detail='Employee not found',
        )

    try:
        return await service.update_employee(
            session,
            target_employee,
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
    if (
        current_employee.role != Roles.ADMIN
        and current_employee.id != employee_id
    ):
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail='You can only delete your own employee',
        )

    target_employee = await EmployeeRepository.get_by_id(
        session,
        employee_id,
    )
    if target_employee is None:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND,
            detail='Employee not found',
        )

    await service.delete_employee(
        session,
        target_employee,
    )
