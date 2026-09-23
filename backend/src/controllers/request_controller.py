from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.request_schema import RequestCreate, RequestUpdate
from src.services.request_service import RequestService


class RequestController:
    @staticmethod
    async def create(
        data: RequestCreate,
        session: AsyncSession,
        current_employee: Employee,
    ):

        service = RequestService(session)

        return await service.create(data, current_employee)

    @staticmethod
    async def get_all(session: AsyncSession, current_employee: Employee):

        service = RequestService(session)

        return await service.get_all(current_employee)

    @staticmethod
    async def update(
        request_id: int,
        data: RequestUpdate,
        session: AsyncSession,
        current_employee: Employee,
    ):

        service = RequestService(session)

        return await service.update(request_id, data, current_employee)

    @staticmethod
    async def delete(
        request_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ):

        service = RequestService(session)

        await service.delete(request_id, current_employee)
