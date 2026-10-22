from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
        query = select(Employee).options(
            selectinload(Employee.freelancer_profile)
        )

        if filters is not None:
            if filters.role is not None:
                query = query.where(Employee.role == filters.role)

            if filters.username is not None:
                query = query.where(
                    Employee.username.ilike(f'%{filters.username}%')
                )

            if filters.email is not None:
                query = query.where(Employee.email.ilike(f'%{filters.email}%'))

        result = await session.scalars(query.offset(offset).limit(limit))

        return result.all()

    @staticmethod
    async def get_by_email_or_username(
        session: AsyncSession,
        email: str | None = None,
        username: str | None = None,
    ):
        conditions = []

        if email is not None:
            conditions.append(Employee.email == email)

        if username is not None:
            conditions.append(Employee.username == username)

        if not conditions:
            return None

        return await session.scalar(select(Employee).where(or_(*conditions)))

    @staticmethod
    async def get_by_id(
        session: AsyncSession,
        employee_id: int,
    ) -> Employee | None:
        return await session.scalar(
            select(Employee)
            .options(selectinload(Employee.freelancer_profile))
            .where(Employee.id == employee_id)
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
