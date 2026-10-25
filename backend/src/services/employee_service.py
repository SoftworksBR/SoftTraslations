import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import EmployeeStatus, Roles
from src.models.employee_model import Employee
from src.repositories.employee_repository import EmployeeRepository
from src.schemas.employee_schema import (
    EmployeeCreate,
    EmployeePublicSchema,
    EmployeeSearchFilters,
    EmployeeUpdate,
    FreelancerInviteAcceptSchema,
    FreelancerInviteResponse,
    FreelancerPreRegistrationSchema,
)
from src.security import get_password_hash

FREELANCER_INVITE_TOKEN_TTL = timedelta(days=7)


def _utc_now_naive() -> datetime:
    # O banco guarda horários sem timezone (igual created_at), então o
    # valor em memória também precisa ficar "naive" para dar pra comparar.
    return datetime.now(UTC).replace(tzinfo=None)


def _hash_invite_token(raw_token: str) -> str:
    # SHA-256 simples: o token já tem entropia alta (secrets.token_urlsafe),
    # então não precisa de um hash lento/salgado como o de senha — e
    # precisa ser determinístico para dar para buscar por igualdade no
    # banco (um hash de senha gera um valor diferente a cada chamada).
    return hashlib.sha256(raw_token.encode()).hexdigest()


class EmployeeService:
    @staticmethod
    async def create_initial_admin(
        session: AsyncSession,
        employee: EmployeeCreate,
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
        filters: EmployeeSearchFilters,
    ):
        if current_employee.role not in {Roles.ADMIN, Roles.PROJETOS}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You do not have permission to view employees',
            )

        if current_employee.role == Roles.PROJETOS:
            if filters.role is not None and filters.role != Roles.FREELANCER:
                return []
            filters = filters.model_copy(update={'role': Roles.FREELANCER})

        employees = await EmployeeRepository.get_employees(
            session,
            limit,
            offset,
            filters=filters,
        )

        return [
            EmployeeService._to_public_schema(employee, current_employee)
            for employee in employees
        ]

    @staticmethod
    def _to_public_schema(
        employee: Employee, viewer: Employee
    ) -> EmployeePublicSchema:
        can_view_private_fields = (
            viewer.role == Roles.ADMIN or viewer.id == employee.id
        )

        return EmployeePublicSchema(
            id=employee.id,
            first_name=employee.first_name,
            last_name=employee.last_name,
            email=employee.email,
            role=employee.role,
            status=employee.status,
            birth_date=employee.birth_date
            if can_view_private_fields
            else None,
            phone=employee.phone if can_view_private_fields else None,
            photo_path=employee.photo_path,
        )

    @staticmethod
    async def create_employee(
        session: AsyncSession,
        employee: EmployeeCreate,
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
    ) -> FreelancerInviteResponse:
        if current_employee.role != Roles.PROJETOS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only projetos can pre-register freelancers',
            )

        existing_employee = await EmployeeRepository.get_by_email(
            session, data.email
        )
        if existing_employee is not None:
            raise ValueError('Email already registered')

        # Sem senha própria ainda: o freelancer só define uma ao aceitar o
        # convite. Esse hash aleatório nunca é informado a ninguém e não
        # permite login até ser substituído em accept_freelancer_invite.
        unusable_password = get_password_hash(secrets.token_urlsafe(32))
        raw_invite_token = secrets.token_urlsafe(32)

        employee = Employee(
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            password=unusable_password,
            role=Roles.FREELANCER,
            status=EmployeeStatus.PENDING,
            invite_token_hash=_hash_invite_token(raw_invite_token),
            invite_token_expires_at=(
                _utc_now_naive() + FREELANCER_INVITE_TOKEN_TTL
            ),
        )

        created_employee = await EmployeeRepository.create(session, employee)

        return FreelancerInviteResponse(
            id=created_employee.id,
            first_name=created_employee.first_name,
            last_name=created_employee.last_name,
            email=created_employee.email,
            invite_token=raw_invite_token,
        )

    @staticmethod
    async def accept_freelancer_invite(
        session: AsyncSession,
        data: FreelancerInviteAcceptSchema,
    ) -> Employee:
        invite_token_hash = _hash_invite_token(data.token)
        employee = await EmployeeRepository.get_by_invite_token_hash(
            session, invite_token_hash
        )
        if employee is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Invalid invite token',
            )

        if (
            employee.invite_token_expires_at is None
            or employee.invite_token_expires_at < _utc_now_naive()
        ):
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail='Invite token has expired',
            )

        consumed_employee = await EmployeeRepository.consume_invite_token(
            session,
            employee_id=employee.id,
            invite_token_hash=invite_token_hash,
            password_hash=get_password_hash(data.password),
        )
        if consumed_employee is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Invalid invite token',
            )

        return consumed_employee

    @staticmethod
    async def _create_employee_record(
        session: AsyncSession,
        employee: EmployeeCreate,
    ):
        db_employee = await EmployeeRepository.get_by_email(
            session,
            employee.email,
        )

        if db_employee:
            raise ValueError('Email already registered')

        db_employee = Employee(
            first_name=employee.first_name,
            last_name=employee.last_name,
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
        employee: EmployeeUpdate,
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
            current_employee.role != Roles.ADMIN
            and employee.role != target_employee.role
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only admins can change employee roles',
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

        if (
            current_employee.role != Roles.ADMIN
            and target_employee.status == EmployeeStatus.UNDER_REVIEW
            and employee.status != EmployeeStatus.UNDER_REVIEW
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Freelancers cannot approve their own registration',
            )

        target_employee.first_name = employee.first_name
        target_employee.last_name = employee.last_name
        target_employee.email = employee.email
        target_employee.password = get_password_hash(employee.password)
        target_employee.role = employee.role
        target_employee.status = employee.status

        # Campo omitido fica como está; null enviado explicitamente apaga.
        for field in ('birth_date', 'phone', 'photo_path'):
            if field in employee.model_fields_set:
                setattr(target_employee, field, getattr(employee, field))

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
