from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.models.project_model import Project, project_stages
from src.models.stage_model import Stage


class StageRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, stage: Stage) -> Stage:

        self.session.add(stage)

        await self.session.commit()
        await self.session.refresh(stage)

        return stage

    async def get_by_id(self, stage_id: int) -> Stage | None:

        result = await self.session.execute(
            select(Stage).where(Stage.id == stage_id)
        )

        return result.scalar_one_or_none()

    async def get_all(
        self,
        name: str | None = None,
        status=None,
        project_name: str | None = None,
        freelancer_name: str | None = None,
    ) -> list[Stage]:
        statement = select(Stage)

        if name is not None:
            statement = statement.where(Stage.name.ilike(f'%{name}%'))

        if status is not None:
            statement = statement.where(Stage.status == status)

        if project_name is not None:
            project_subquery = (
                select(project_stages.c.stage_id)
                .join(Project, project_stages.c.project_id == Project.id)
                .where(Project.name.ilike(f'%{project_name}%'))
            )
            statement = statement.where(Stage.id.in_(project_subquery))

        if freelancer_name is not None:
            statement = statement.join(
                Employee, Stage.freelancer_id == Employee.id
            )
            statement = statement.where(
                Employee.username.ilike(f'%{freelancer_name}%')
            )

        result = await self.session.execute(statement)

        return list(result.scalars().all())

    async def update(self, stage: Stage) -> Stage:

        await self.session.commit()
        await self.session.refresh(stage)

        return stage

    async def delete(self, stage: Stage) -> None:

        await self.session.delete(stage)

        await self.session.commit()
