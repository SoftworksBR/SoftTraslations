from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.project_schema import ProjectCreate, ProjectUpdate
from src.services.project_service import ProjectService


class ProjectController:
    @staticmethod
    async def create(data: ProjectCreate, session: AsyncSession):
        service = ProjectService(session)

        return await service.create(data)

    @staticmethod
    async def get_by_id(project_id: int, session: AsyncSession):
        service = ProjectService(session)

        return await service.get_by_id(project_id)

    @staticmethod
    async def get_all(
        session: AsyncSession,
        name: str | None = None,
        status=None,
        stage_name: str | None = None,
        freelancer_name: str | None = None,
        creator_name: str | None = None,
    ):
        service = ProjectService(session)

        return await service.get_all(
            name=name,
            status=status,
            stage_name=stage_name,
            freelancer_name=freelancer_name,
            creator_name=creator_name,
        )

    @staticmethod
    async def update(
        project_id: int, data: ProjectUpdate, session: AsyncSession
    ):
        service = ProjectService(session)

        return await service.update(project_id, data)

    @staticmethod
    async def delete(project_id: int, session: AsyncSession):
        service = ProjectService(session)

        await service.delete(project_id)
