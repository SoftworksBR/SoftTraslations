from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.project_schema import ProjectCreate, ProjectUpdate
from src.services.project_service import ProjectService


class ProjectController:
    @staticmethod
    async def create(
        data: ProjectCreate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = ProjectService(session)

        return await service.create(data, current_employee)

    @staticmethod
    async def get_all(session: AsyncSession, current_employee: Employee):
        service = ProjectService(session)

        return await service.get_all(current_employee)

    @staticmethod
    async def update(
        project_id: int,
        data: ProjectUpdate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = ProjectService(session)

        return await service.update(project_id, data, current_employee)

    @staticmethod
    async def delete(
        project_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = ProjectService(session)

        await service.delete(project_id, current_employee)
