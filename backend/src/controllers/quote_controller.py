from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.quote_schema import (
    QuoteCreate,
    QuoteSearchFilters,
    QuoteUpdate,
)
from src.services.quote_service import QuoteService


class QuoteController:
    @staticmethod
    async def create(
        data: QuoteCreate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        return await QuoteService(session).create(data, current_employee)

    @staticmethod
    async def suggest(
        request_id: int,
        word_count: int | None,
        session: AsyncSession,
        current_employee: Employee,
    ):
        return await QuoteService(session).suggest(
            request_id, word_count, current_employee
        )

    @staticmethod
    async def get_by_id(
        quote_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ):
        return await QuoteService(session).get_by_id(
            quote_id, current_employee
        )

    @staticmethod
    async def get_all(
        session: AsyncSession,
        current_employee: Employee,
        filters: QuoteSearchFilters,
    ):
        return await QuoteService(session).get_all(current_employee, filters)

    @staticmethod
    async def update(
        quote_id: int,
        data: QuoteUpdate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        return await QuoteService(session).update(
            quote_id, data, current_employee
        )

    @staticmethod
    async def approve(
        quote_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ):
        return await QuoteService(session).approve(quote_id, current_employee)

    @staticmethod
    async def reject(
        quote_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ):
        return await QuoteService(session).reject(quote_id, current_employee)

    @staticmethod
    async def delete(
        quote_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ):
        await QuoteService(session).delete(quote_id, current_employee)
