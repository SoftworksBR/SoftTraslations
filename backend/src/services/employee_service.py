from src.models.employee_model import Employee
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.employee_repository import EmployeeRepository
from src.schemas.employee_schema import EmployeeSchema
from src.security import get_password_hash


class EmployeeService:
    @staticmethod
    async def get_employees(
        session: AsyncSession,
        limit: int,
        offset: int,
    ):
        return await EmployeeRepository.get_employees(
            session,
            limit,
            offset,
        )

    @staticmethod
    async def create_employee(
        session: AsyncSession,
        employee: EmployeeSchema,
    ):
        db_employee = await EmployeeRepository.get_by_email_or_username(
            session,
            employee.email,
            employee.username,
        )

        if db_employee:
            if db_employee.email == employee.email:
                raise ValueError('Email already registered')

            if db_employee.username == employee.username:
                raise ValueError('employeename already registered')

        db_employee = employee(
            username=employee.username,
            email=employee.email,
            password=get_password_hash(employee.password),
        )

        return await EmployeeRepository.create(
            session,
            db_employee,
        )

    @staticmethod
    async def update_employee(
        session: AsyncSession,
        current_employee: Employee,
        employee: EmployeeSchema,
    ):
        current_employee.username = employee.username
        current_employee.email = employee.email
        current_employee.password = get_password_hash(employee.password)

        return await EmployeeRepository.update(
            session,
            current_employee,
        )

    @staticmethod
    async def delete_employee(
        session: AsyncSession,
        current_employee: Employee,
    ):
        await EmployeeRepository.delete(
            session,
            current_employee,
        )
