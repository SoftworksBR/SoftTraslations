from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.employee_schema import EmployeeSearchFilters


class EmployeeRepository:
    @staticmethod
    async def get_employees(
        session: AsyncSession,
        limit: int,
        offset: int,
        filters: EmployeeSearchFilters | None = None,
    ):
        query = select(Employee)

        if filters is not None:
            if filters.role is not None:
                query = query.where(Employee.role == filters.role)

            if filters.first_name is not None:
                query = query.where(
                    Employee.first_name.ilike(f'%{filters.first_name}%')
                )

            if filters.last_name is not None:
                query = query.where(
                    Employee.last_name.ilike(f'%{filters.last_name}%')
                )

            if filters.email is not None:
                query = query.where(Employee.email.ilike(f'%{filters.email}%'))

        result = await session.scalars(query.offset(offset).limit(limit))

        return result.all()

    @staticmethod
    async def get_by_email(
        session: AsyncSession,
        email: str,
    ):
        return await session.scalar(
            select(Employee).where(Employee.email == email)
        )

    @staticmethod
    async def get_by_invite_token_hash(
        session: AsyncSession,
        invite_token_hash: str,
    ):
        return await session.scalar(
            select(Employee).where(
                Employee.invite_token_hash == invite_token_hash
            )
        )

    @staticmethod
    async def consume_invite_token(
        session: AsyncSession,
        employee_id: int,
        invite_token_hash: str,
        password_hash: str,
    ) -> Employee | None:
        # UPDATE condicional: só grava se o hash ainda estiver lá, então
        # entre requisições simultâneas apenas uma consome o convite.
        employee = await session.scalar(
            update(Employee)
            .where(
                Employee.id == employee_id,
                Employee.invite_token_hash == invite_token_hash,
            )
            .values(
                password=password_hash,
                invite_token_hash=None,
                invite_token_expires_at=None,
            )
            .returning(Employee)
        )
        await session.commit()

        return employee

    @staticmethod
    async def get_by_id(
        session: AsyncSession,
        employee_id: int,
    ) -> Employee | None:
        return await session.scalar(
            select(Employee).where(Employee.id == employee_id)
        )

    @staticmethod
    async def create(
        session: AsyncSession,
        employee: Employee,
    ):
        session.add(employee)

        await session.commit()
        await session.refresh(employee)

        return employee

    @staticmethod
    async def update(
        session: AsyncSession,
        employee: Employee,
    ):
        session.add(employee)

        await session.commit()
        await session.refresh(employee)

        return employee

    @staticmethod
    async def delete(
        session: AsyncSession,
        employee: Employee,
    ):
        await session.delete(employee)
        await session.commit()
