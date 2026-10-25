from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.models.path_model import Path
from src.models.project_model import Project
from src.models.stage_model import Stage
from src.schemas.stage_schema import StageSearchFilters


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
        freelancer_id: int | None = None,
        filters: StageSearchFilters | None = None,
    ) -> list[Stage]:
        query = select(Stage)

        if freelancer_id is not None:
            query = query.where(Stage.freelancer_id == freelancer_id)

        if filters is not None:
            if filters.name is not None:
                query = query.where(Stage.name.ilike(f'%{filters.name}%'))

            if filters.status is not None:
                query = query.where(Stage.status == filters.status)

            if filters.project_name is not None:
                project_subquery = (
                    select(Stage.id)
                    .join(Stage.paths)
                    .join(Path.projects)
                    .where(Project.name.ilike(f'%{filters.project_name}%'))
                )
                query = query.where(Stage.id.in_(project_subquery))

            if filters.freelancer_name is not None:
                freelancer_subquery = select(Employee.id).where(
                    func.concat_ws(
                        ' ', Employee.first_name, Employee.last_name
                    ).ilike(f'%{filters.freelancer_name}%')
                )
                query = query.where(
                    Stage.freelancer_id.in_(freelancer_subquery)
                )

        result = await self.session.execute(query)

        return list(result.scalars().all())

    async def update(self, stage: Stage) -> Stage:

        await self.session.commit()
        await self.session.refresh(stage)

        return stage

    async def delete(self, stage: Stage) -> None:

        await self.session.delete(stage)

        await self.session.commit()
