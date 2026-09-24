from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.stage_schema import (
    ProjectStageCreate,
    StageCreate,
    StageUpdate,
)
from src.services.stage_service import StageService


class StageController:
    @staticmethod
    async def create(data: StageCreate, session: AsyncSession):
        service = StageService(session)

        return await service.create(data)

    @staticmethod
    async def create_for_project(
        project_id: int,
        data: ProjectStageCreate,
        session: AsyncSession,
    ):
        service = StageService(session)

        return await service.create_for_project(project_id, data)

    @staticmethod
    async def get_by_id(stage_id: int, session: AsyncSession):
        service = StageService(session)

        return await service.get_by_id(stage_id)

    @staticmethod
    async def get_all(
        session: AsyncSession,
        name: str | None = None,
        status=None,
        project_name: str | None = None,
        freelancer_name: str | None = None,
    ):
        service = StageService(session)

        return await service.get_all(
            name=name,
            status=status,
            project_name=project_name,
            freelancer_name=freelancer_name,
        )

    @staticmethod
    async def update(stage_id: int, data: StageUpdate, session: AsyncSession):
        service = StageService(session)

        return await service.update(stage_id, data)

    @staticmethod
    async def delete(stage_id: int, session: AsyncSession):
        service = StageService(session)

        await service.delete(stage_id)
