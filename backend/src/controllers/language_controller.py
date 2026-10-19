from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.language_schema import LanguageCreate, LanguageUpdate
from src.services.language_service import LanguageService


class LanguageController:
    @staticmethod
    async def create(
        data: LanguageCreate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = LanguageService(session)
        return await service.create(data, current_employee)

    @staticmethod
    async def list(
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = LanguageService(session)
        return await service.get_all()

    @staticmethod
    async def update(
        language_id: int,
        data: LanguageUpdate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = LanguageService(session)
        return await service.update(
            language_id,
            data,
            current_employee,
        )
