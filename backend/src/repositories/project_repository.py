from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.employee_model import Employee
from src.models.path_model import Path
from src.models.project_model import Project
from src.models.stage_model import Stage
from src.schemas.project_schema import ProjectSearchFilters


class ProjectRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, project: Project) -> Project:
        self.session.add(project)

        await self.session.commit()
        await self.session.refresh(project)

        result = await self.session.execute(
            select(Project)
            .options(selectinload(Project.paths).selectinload(Path.stages))
            .where(Project.id == project.id)
        )

        return result.scalar_one()

    async def get_by_id(self, project_id: int) -> Project | None:
        result = await self.session.execute(
            select(Project)
            .options(selectinload(Project.paths).selectinload(Path.stages))
            .where(Project.id == project_id)
        )

        return result.scalar_one_or_none()

    async def get_all(
        self,
        filters: ProjectSearchFilters | None = None,
    ) -> list[Project]:
        statement = select(Project).options(
            selectinload(Project.paths).selectinload(Path.stages)
        )

        if filters is not None:
            if filters.name is not None:
                statement = statement.where(
                    Project.name.ilike(f'%{filters.name}%')
                )

            if filters.status is not None:
                statement = statement.where(Project.status == filters.status)

            if filters.stage_name is not None:
                stage_subquery = (
                    select(Project.id)
                    .join(Project.paths)
                    .join(Path.stages)
                    .where(Stage.name.ilike(f'%{filters.stage_name}%'))
                )
                statement = statement.where(Project.id.in_(stage_subquery))

            if filters.freelancer_name is not None:
                freelancer_subquery = (
                    select(Project.id)
                    .join(Project.paths)
                    .join(Path.stages)
                    .join(Employee, Stage.freelancer_id == Employee.id)
                    .where(
                        Employee.username.ilike(f'%{filters.freelancer_name}%')
                    )
                )
                statement = statement.where(
                    Project.id.in_(freelancer_subquery)
                )

            if filters.creator_name is not None:
                creator_subquery = select(Employee.id).where(
                    Employee.username.ilike(f'%{filters.creator_name}%')
                )
                statement = statement.where(
                    Project.creator_id.in_(creator_subquery)
                )

        result = await self.session.execute(statement)

        return list(result.scalars().all())

    async def update(self, project: Project) -> Project:
        await self.session.commit()
        await self.session.refresh(project)

        return project

    async def delete(self, project: Project) -> None:
        await self.session.delete(project)
        await self.session.commit()
