from src.models.employee_model import Employee
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


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
        email: str,
        username: str,
    ):
        return await session.scalar(
            select(Employee).where(
                (Employee.email == email) | (Employee.username == username)
            )
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
