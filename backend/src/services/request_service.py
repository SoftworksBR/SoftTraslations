from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import Roles
from src.models.employee_model import Employee
from src.models.request_model import Request
from src.repositories.request_repository import RequestRepository
from src.schemas.request_schema import RequestCreate, RequestUpdate


class RequestService:
    def __init__(self, session: AsyncSession):
        self.repository = RequestRepository(session)

    async def create(
        self, data: RequestCreate, current_employee: Employee
    ) -> Request:
        self._require_projects_role(current_employee)

        request = Request(
            username=data.username,
            email=data.email,
            phone=data.phone,
            company=data.company,
            translate_from=data.translate_from,
            translate_to=data.translate_to,
            observations=data.observations,
            employee_id=data.employee_id,
        )

        return await self.repository.create(request)

    async def get_by_id(self, request_id: int) -> Request:

        request = await self.repository.get_by_id(request_id)

        if request is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Solicitação não encontrada',
            )

        return request

    async def get_all(self, current_employee: Employee) -> list[Request]:
        self._require_projects_role(current_employee)

        return await self.repository.get_all()

    async def update(
        self,
        request_id: int,
        data: RequestUpdate,
        current_employee: Employee,
    ) -> Request:
        self._require_projects_role(current_employee)

        request = await self.get_by_id(request_id)

        if data.username is not None:
            request.username = data.username

        if data.email is not None:
            request.email = data.email

        if data.phone is not None:
            request.phone = data.phone

        if data.company is not None:
            request.company = data.company

        if data.translate_from is not None:
            request.translate_from = data.translate_from

        if data.translate_to is not None:
            request.translate_to = data.translate_to

        if data.observations is not None:
            request.observations = data.observations

        if data.employee_id is not None:
            request.employee_id = data.employee_id

        return await self.repository.update(request)

    async def delete(
        self, request_id: int, current_employee: Employee
    ) -> None:
        self._require_projects_role(current_employee)

        request = await self.get_by_id(request_id)

        await self.repository.delete(request)

    @staticmethod
    def _require_projects_role(current_employee: Employee) -> None:
        if current_employee.role != Roles.PROJETOS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only projetos can use this endpoint',
            )
