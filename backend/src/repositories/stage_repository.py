from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.employee_model import Employee
from src.models.project_model import Project, ProjectPath
from src.models.stage_model import (
    PathStage,
    ProjectStage,
    Stage,
    StageTemplate,
)
from src.schemas.stage_schema import StageSearchFilters


class StageRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, stage: Stage) -> Stage:

        self.session.add(stage)

        await self.session.commit()
        await self.session.refresh(stage)

        return stage

    async def create_template(self, template: StageTemplate) -> StageTemplate:
        self.session.add(template)
        await self.session.commit()
        await self.session.refresh(template)

        return template

    async def get_by_id(self, stage_id: int) -> Stage | None:

        result = await self.session.execute(
            select(Stage)
            .options(
                selectinload(Stage.path_stage).selectinload(
                    PathStage.stage_template
                )
            )
            .where(Stage.id == stage_id)
        )

        return result.scalar_one_or_none()

    async def get_all(
        self,
        freelancer_id: int | None = None,
        filters: StageSearchFilters | None = None,
    ) -> list[Stage]:
        query = select(Stage).options(
            selectinload(Stage.path_stage).selectinload(
                PathStage.stage_template
            )
        )

        if freelancer_id is not None:
            query = query.where(Stage.freelancer_id == freelancer_id)

        if filters is not None:
            if filters.name is not None:
                query = (
                    query
                    .join(Stage.path_stage)
                    .join(PathStage.stage_template)
                    .where(StageTemplate.name.ilike(f'%{filters.name}%'))
                )

            if filters.status is not None:
                query = query.where(Stage.status == filters.status)

            if filters.project_name is not None:
                project_subquery = (
                    select(Stage.id)
                    .join(Stage.project_path)
                    .join(ProjectPath.project)
                    .where(Project.name.ilike(f'%{filters.project_name}%'))
                )
                query = query.where(Stage.id.in_(project_subquery))

            if filters.freelancer_name is not None:
                freelancer_subquery = (
                    select(ProjectStage.id)
                    .join(ProjectStage.freelancer)
                    .where(
                        Employee.username.ilike(f'%{filters.freelancer_name}%')
                    )
                )
                query = query.where(Stage.id.in_(freelancer_subquery))

        result = await self.session.execute(query)

        return list(result.scalars().all())

    async def update(self, stage: Stage) -> Stage:

        await self.session.commit()
        return await self.get_by_id(stage.id) or stage

    async def delete(self, stage: Stage) -> None:

        await self.session.delete(stage)

        await self.session.commit()
