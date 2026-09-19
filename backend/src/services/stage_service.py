from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import Status
from src.models.employee_model import Employee
from src.models.project_model import Project
from src.models.stage_model import Stage
from src.repositories.stage_repository import StageRepository
from src.schemas.stage_schema import (
    ProjectStageCreate,
    StageCreate,
    StageUpdate,
)


class StageService:
    def __init__(self, session: AsyncSession):
        self.repository = StageRepository(session)

    async def create(self, data: StageCreate) -> Stage:
        return await self._create_for_project(
            data.project_id,
            data.freelancer_id,
            data.status,
        )

    async def create_for_project(
        self,
        project_id: int,
        data: ProjectStageCreate,
    ) -> Stage:
        return await self._create_for_project(
            project_id,
            data.freelancer_id,
            data.status,
        )

    async def _create_for_project(
        self,
        project_id: int,
        freelancer_id: int,
        stage_status: Status,
    ) -> Stage:
        project = await self.repository.session.scalar(
            select(Project).where(Project.id == project_id)
        )
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Project not found',
            )

        freelancer = await self.repository.session.scalar(
            select(Employee).where(Employee.id == freelancer_id)
        )
        if freelancer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Freelancer not found',
            )

        stage = Stage(freelancer_id=freelancer_id, status=stage_status)
        stage.projects.append(project)

        return await self.repository.create(stage)

    async def get_by_id(self, stage_id: int) -> Stage:

        stage = await self.repository.get_by_id(stage_id)

        if stage is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Stage not found',
            )

        return stage

    async def get_all(self) -> list[Stage]:

        return await self.repository.get_all()

    async def update(self, stage_id: int, data: StageUpdate) -> Stage:

        stage = await self.get_by_id(stage_id)

        if data.freelancer_id is not None:
            stage.freelancer_id = data.freelancer_id

        if data.status is not None:
            stage.status = data.status

        return await self.repository.update(stage)

    async def delete(self, stage_id: int) -> None:

        stage = await self.get_by_id(stage_id)

        await self.repository.delete(stage)
