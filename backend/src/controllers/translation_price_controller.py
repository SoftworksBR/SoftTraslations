from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.translation_price_schema import (
    TranslationPriceCreate,
    TranslationPriceUpdate,
)
from src.services.translation_price_service import TranslationPriceService


class TranslationPriceController:
    @staticmethod
    async def create(
        data: TranslationPriceCreate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = TranslationPriceService(session)
        return await service.create(data, current_employee)

    @staticmethod
    async def list(
        session: AsyncSession,
        current_employee: Employee,
        include_inactive: bool = False,
    ):
        service = TranslationPriceService(session)
        return await service.get_all(current_employee, include_inactive)

    @staticmethod
    async def update(
        price_id: int,
        data: TranslationPriceUpdate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = TranslationPriceService(session)
        return await service.update(
            price_id, data, current_employee
        )
