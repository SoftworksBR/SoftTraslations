from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.path_schema import PathCreate
from src.services.path_service import PathService


class PathController:
    @staticmethod
    async def create(
        data: PathCreate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = PathService(session)

        return await service.create(data, current_employee)

    @staticmethod
    async def get_all(session: AsyncSession, current_employee: Employee):
        service = PathService(session)

        return await service.get_all(current_employee)
