from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee


class EmployeeRepository:
    @staticmethod
    async def get_employees(
        session: AsyncSession,
        limit: int,
        offset: int,
    ):
        result = await session.scalars(
            select(Employee).offset(offset).limit(limit)
        )

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
