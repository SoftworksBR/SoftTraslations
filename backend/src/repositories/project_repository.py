from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.project_model import Project


class ProjectRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, project: Project) -> Project:
        self.session.add(project)

        await self.session.commit()
        await self.session.refresh(project)

        result = await self.session.execute(
            select(Project)
            .options(selectinload(Project.stages))
            .where(Project.id == project.id)
        )

        return result.scalar_one()

    async def get_by_id(self, project_id: int) -> Project | None:
        result = await self.session.execute(
            select(Project)
            .options(selectinload(Project.stages))
            .where(Project.id == project_id)
        )

        return result.scalar_one_or_none()

    async def get_all(self) -> list[Project]:
        result = await self.session.execute(
            select(Project)
            .options(selectinload(Project.stages))
        )

        return list(result.scalars().all())

    async def update(self, project: Project) -> Project:
        await self.session.commit()
        await self.session.refresh(project)

        return project

    async def delete(self, project: Project) -> None:
        await self.session.delete(project)
        await self.session.commit()
