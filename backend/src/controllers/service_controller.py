from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.service_schema import ServiceCreate, ServiceUpdate
from src.services.service_service import ServiceService


class ServiceController:
    @staticmethod
    async def create(
        data: ServiceCreate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = ServiceService(session)
        return await service.create(data, current_employee)

    @staticmethod
    async def list(
        session: AsyncSession,
        current_employee: Employee,
        include_inactive: bool = False,
    ):
        service = ServiceService(session)
        return await service.get_all(current_employee, include_inactive)

    @staticmethod
    async def update(
        service_id: int,
        data: ServiceUpdate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = ServiceService(session)
        return await service.update(
            service_id, data, current_employee
        )
