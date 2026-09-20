from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.project_model import Project
from src.repositories.project_repository import ProjectRepository
from src.schemas.project_schema import ProjectCreate, ProjectUpdate


class ProjectService:
    def __init__(self, session: AsyncSession):
        self.repository = ProjectRepository(session)

    async def create(self, data: ProjectCreate) -> Project:
        project = Project(
            name=data.name, status=data.status, creator_id=data.creator_id
        )

        return await self.repository.create(project)

    async def get_by_id(self, project_id: int) -> Project:
        project = await self.repository.get_by_id(project_id)

        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Projeto não encontrado',
            )

        return project

    async def get_all(self) -> list[Project]:
        return await self.repository.get_all()

    async def update(self, project_id: int, data: ProjectUpdate) -> Project:

        project = await self.get_by_id(project_id)

        if data.name is not None:
            project.name = data.name

        if data.status is not None:
            project.status = data.status

        if data.creator_id is not None:
            project.creator_id = data.creator_id

        return await self.repository.update(project)

    async def delete(self, project_id: int) -> None:
        project = await self.get_by_id(project_id)

        await self.repository.delete(project)
