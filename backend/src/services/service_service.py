from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import Roles
from src.models.employee_model import Employee
from src.models.service_model import Service
from src.repositories.service_repository import ServiceRepository
from src.schemas.service_schema import ServiceCreate, ServiceUpdate


class ServiceService:
    def __init__(self, session: AsyncSession):
        self.repository = ServiceRepository(session)

    @staticmethod
    def _require_admin(employee: Employee) -> None:
        if employee.role != Roles.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Somente administradores podem alterar serviços.",
            )

    async def create(
        self,
        data: ServiceCreate,
        employee: Employee,
    ) -> Service:
        self._require_admin(employee)

        service = Service(
            name=data.name,
            description=data.description,
        )

        try:
            return await self.repository.create(service)
        except IntegrityError as exc:
            await self.repository.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um serviço com esse nome.",
            ) from exc

    async def get_all(
        self,
        employee: Employee,
        include_inactive: bool = False,
    ) -> list[Service]:
        if include_inactive:
            self._require_admin(employee)
        services = await self.repository.get_all()
        if include_inactive:
            return services
        return [service for service in services if service.is_active]

    async def update(
        self,
        service_id: int,
        data: ServiceUpdate,
        employee: Employee,
    ) -> Service:
        self._require_admin(employee)

        service = await self.repository.get_by_id(service_id)
        if service is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Serviço não encontrado.",
            )

        if data.name is not None:
            service.name = data.name

        if "description" in data.model_fields_set:
            service.description = data.description

        if data.is_active is not None:
            service.is_active = data.is_active

        try:
            return await self.repository.update(service)
        except IntegrityError as exc:
            await self.repository.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um serviço com esse nome.",
            ) from exc
