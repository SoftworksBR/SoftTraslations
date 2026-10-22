from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.models.employee_model import Employee
from src.models.project_model import Project, ProjectPath
from src.models.stage_model import (
    PathStage,
    ProjectStage,
    StageTemplate,
)
from src.schemas.stage_schema import StageSearchFilters


class StageRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, stage: ProjectStage) -> ProjectStage:
        self.session.add(stage)
        await self.session.commit()
        return await self.get_by_id(stage.id)

    async def create_template(self, template: StageTemplate) -> StageTemplate:
        self.session.add(template)
        await self.session.commit()
        await self.session.refresh(template)
        return template

    async def get_template(self, template_id: int) -> StageTemplate | None:
        return await self.session.get(StageTemplate, template_id)

    async def get_templates(self) -> list[StageTemplate]:
        result = await self.session.scalars(
            select(StageTemplate).order_by(StageTemplate.id)
        )
        return list(result)

    async def get_by_id(self, stage_id: int) -> ProjectStage | None:
        result = await self.session.execute(
            select(ProjectStage)
            .options(
                joinedload(ProjectStage.path_stage).joinedload(
                    PathStage.stage_template
                ),
                joinedload(ProjectStage.project_path).joinedload(
                    ProjectPath.path
                ),
            )
            .where(ProjectStage.id == stage_id)
        )
        return result.unique().scalar_one_or_none()

    async def get_all(
        self,
        freelancer_id: int | None = None,
        filters: StageSearchFilters | None = None,
    ) -> list[ProjectStage]:
        query = select(ProjectStage).options(
            joinedload(ProjectStage.path_stage).joinedload(
                PathStage.stage_template
            ),
            joinedload(ProjectStage.project_path).joinedload(
                ProjectPath.project
            ),
        )

        if freelancer_id is not None:
            query = query.where(ProjectStage.freelancer_id == freelancer_id)

        if filters is not None:
            if filters.name is not None:
                query = query.join(ProjectStage.path_stage).join(
                    PathStage.stage_template
                )
                query = query.where(
                    StageTemplate.name.ilike(f'%{filters.name}%')
                )

            if filters.status is not None:
                query = query.where(ProjectStage.status == filters.status)

            if filters.project_name is not None:
                project_subquery = (
                    select(ProjectStage.id)
                    .join(ProjectStage.project_path)
                    .join(ProjectPath.project)
                    .where(Project.name.ilike(f'%{filters.project_name}%'))
                )
                query = query.where(ProjectStage.id.in_(project_subquery))

            if filters.freelancer_name is not None:
                freelancer_subquery = select(Employee.id).where(
                    Employee.username.ilike(f'%{filters.freelancer_name}%')
                )
                query = query.where(
                    ProjectStage.freelancer_id.in_(freelancer_subquery)
                )

        result = await self.session.execute(query)
        return list(result.unique().scalars().all())

    async def update(self, stage: ProjectStage) -> ProjectStage:
        await self.session.commit()
        return await self.get_by_id(stage.id)

    async def delete(self, stage: ProjectStage) -> None:
        await self.session.delete(stage)
        await self.session.commit()
