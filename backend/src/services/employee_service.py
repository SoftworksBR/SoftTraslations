from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import EmployeeStatus, Roles
from src.models.employee_model import Employee
from src.repositories.employee_repository import EmployeeRepository
from src.schemas.employee_schema import (
    EmployeeSchema,
    FreelancerPreRegistrationSchema,
    FreelancerProfileSchema,
)
from src.security import get_password_hash


class EmployeeService:
    @staticmethod
    async def create_initial_admin(
        session: AsyncSession,
        employee: EmployeeSchema,
    ):
        if employee.role != Roles.ADMIN:
            raise ValueError('Initial employee must be an admin')

        existing_employees = await EmployeeRepository.get_employees(
            session,
            limit=1,
            offset=0,
        )
        if existing_employees:
            raise ValueError('Initial admin already registered')

        return await EmployeeService._create_employee_record(
            session,
            employee,
        )

    @staticmethod
    async def get_employees(
        session: AsyncSession,
        limit: int,
        offset: int,
        current_employee: Employee,
    ):
        if current_employee.role not in {Roles.ADMIN, Roles.PROJETOS}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You do not have permission to view employees',
            )

        return await EmployeeRepository.get_employees(
            session,
            limit,
            offset,
            (
                Roles.FREELANCER
                if current_employee.role == Roles.PROJETOS
                else None
            ),
        )

    @staticmethod
    async def create_employee(
        session: AsyncSession,
        employee: EmployeeSchema,
        current_employee: Employee,
    ):
        if (
            current_employee.role == Roles.ADMIN
            and employee.role == Roles.FREELANCER
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Admin cannot create a freelancer',
            )

        if (
            current_employee.role == Roles.PROJETOS
            and employee.role != Roles.FREELANCER
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Projetos can only create freelancers',
            )

        if current_employee.role not in {Roles.ADMIN, Roles.PROJETOS}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You do not have permission to create employees',
            )

        return await EmployeeService._create_employee_record(session, employee)

    @staticmethod
    async def pre_register_freelancer(
        session: AsyncSession,
        data: FreelancerPreRegistrationSchema,
        current_employee: Employee,
    ) -> Employee:
        if current_employee.role != Roles.PROJETOS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only projetos can pre-register freelancers',
            )

        existing_employee = await EmployeeRepository.get_by_email_or_username(
            session, email=data.email
        )
        if existing_employee is not None:
            raise ValueError('Email already registered')

        employee = Employee(
            username=data.email,
            email=data.email,
            password=get_password_hash(data.password),
            role=Roles.FREELANCER,
            status=EmployeeStatus.PENDING,
        )

        return await EmployeeRepository.create(session, employee)

    @staticmethod
    async def complete_freelancer_profile(
        session: AsyncSession,
        data: FreelancerProfileSchema,
        current_employee: Employee,
    ) -> Employee:
        if current_employee.role != Roles.FREELANCER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only freelancers can complete this profile',
            )
        if current_employee.status != EmployeeStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Freelancer profile is already complete',
            )

        employee = await EmployeeRepository.get_by_id(
            session, current_employee.id
        )
        if employee is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Employee not found',
            )
        if employee.status != EmployeeStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Freelancer profile is already complete',
            )

        employee.username = data.name.strip()
        employee.status = EmployeeStatus.AVAILABLE

        return await EmployeeRepository.update(session, employee)

    @staticmethod
    async def _create_employee_record(
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

        db_employee = Employee(
            username=employee.username,
            email=employee.email,
            role=employee.role,
            status=(
                EmployeeStatus.PENDING
                if employee.role == Roles.FREELANCER
                else employee.status
            ),
            password=get_password_hash(employee.password),
        )

        return await EmployeeRepository.create(
            session,
            db_employee,
        )

    @staticmethod
    async def update_employee(
        session: AsyncSession,
        employee_id: int,
        employee: EmployeeSchema,
        current_employee: Employee,
    ):
        if (
            current_employee.role != Roles.ADMIN
            and current_employee.id != employee_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You can only update your own employee',
            )

        target_employee = await EmployeeRepository.get_by_id(
            session,
            employee_id,
        )
        if target_employee is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Employee not found',
            )

        if (
            target_employee.role == Roles.FREELANCER
            and target_employee.status == EmployeeStatus.PENDING
            and employee.status != EmployeeStatus.PENDING
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Freelancers must complete their own profile',
            )

        target_employee.username = employee.username
        target_employee.email = employee.email
        target_employee.password = get_password_hash(employee.password)
        target_employee.role = employee.role
        target_employee.status = employee.status

        return await EmployeeRepository.update(
            session,
            target_employee,
        )

    @staticmethod
    async def delete_employee(
        session: AsyncSession,
        employee_id: int,
        current_employee: Employee,
    ):
        if current_employee.role != Roles.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only admins can delete employees',
            )

        target_employee = await EmployeeRepository.get_by_id(
            session,
            employee_id,
        )
        if target_employee is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Employee not found',
            )

        if (
            target_employee.role == Roles.ADMIN
            and target_employee.id != current_employee.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Admins cannot delete other admins',
            )

        await EmployeeRepository.delete(
            session,
            target_employee,
        )
