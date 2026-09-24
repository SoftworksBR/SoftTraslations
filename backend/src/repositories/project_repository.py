from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.employee_model import Employee
from src.models.project_model import Project, project_stages
from src.models.stage_model import Stage


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

    async def get_all(
        self,
        name: str | None = None,
        status=None,
        stage_name: str | None = None,
        freelancer_name: str | None = None,
        creator_name: str | None = None,
    ) -> list[Project]:
        statement = select(Project).options(selectinload(Project.stages))

        if name is not None:
            statement = statement.where(Project.name.ilike(f'%{name}%'))

        if status is not None:
            statement = statement.where(Project.status == status)

        if stage_name is not None:
            stage_subquery = (
                select(project_stages.c.project_id)
                .join(Stage, project_stages.c.stage_id == Stage.id)
                .where(Stage.name.ilike(f'%{stage_name}%'))
            )
            statement = statement.where(Project.id.in_(stage_subquery))

        if freelancer_name is not None:
            freelancer_subquery = (
                select(project_stages.c.project_id)
                .join(Stage, project_stages.c.stage_id == Stage.id)
                .join(Employee, Stage.freelancer_id == Employee.id)
                .where(Employee.username.ilike(f'%{freelancer_name}%'))
            )
            statement = statement.where(Project.id.in_(freelancer_subquery))

        if creator_name is not None:
            statement = statement.join(
                Employee, Project.creator_id == Employee.id
            )
            statement = statement.where(
                Employee.username.ilike(f'%{creator_name}%')
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
