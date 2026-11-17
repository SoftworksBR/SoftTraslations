from sqlalchemy import String, cast, distinct, func, select
from sqlalchemy.dialects.postgresql import aggregate_order_by
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.employee_model import Employee
from src.models.path_model import Path
from src.models.project_model import Project, ProjectPath
from src.models.stage_model import (
    PathStage,
    ProjectStage,
    StageTemplate,
)
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
            .options(
                selectinload(Project.project_paths)
                .selectinload(ProjectPath.path)
                .selectinload(Path.path_stages)
                .selectinload(PathStage.stage_template),
                selectinload(Project.project_paths)
                .selectinload(ProjectPath.executions)
                .selectinload(ProjectStage.path_stage)
                .selectinload(PathStage.stage_template),
                selectinload(Project.project_paths)
                .selectinload(ProjectPath.executions)
                .selectinload(ProjectStage.freelancer),
                selectinload(Project.project_paths)
                .selectinload(ProjectPath.executions)
                .selectinload(ProjectStage.second_freelancer),
                selectinload(Project.project_paths)
                .selectinload(ProjectPath.executions)
                .selectinload(ProjectStage.files),
                selectinload(Project.creator),
            )
            .where(Project.id == project.id)
        )

        return result.scalar_one()

    async def get_by_id(self, project_id: int) -> Project | None:
        result = await self.session.execute(
            select(Project)
            .options(
                selectinload(Project.project_paths)
                .selectinload(ProjectPath.path)
                .selectinload(Path.path_stages)
                .selectinload(PathStage.stage_template),
                selectinload(Project.project_paths)
                .selectinload(ProjectPath.executions)
                .selectinload(ProjectStage.path_stage)
                .selectinload(PathStage.stage_template),
                selectinload(Project.project_paths)
                .selectinload(ProjectPath.executions)
                .selectinload(ProjectStage.freelancer),
                selectinload(Project.project_paths)
                .selectinload(ProjectPath.executions)
                .selectinload(ProjectStage.second_freelancer),
                selectinload(Project.project_paths)
                .selectinload(ProjectPath.executions)
                .selectinload(ProjectStage.files),
                selectinload(Project.creator),
            )
            .where(Project.id == project_id)
        )

        return result.scalar_one_or_none()

    async def get_all(
        self,
        filters: ProjectSearchFilters | None = None,
    ) -> list[Project]:
        statement = select(Project).options(
            selectinload(Project.project_paths)
            .selectinload(ProjectPath.path)
            .selectinload(Path.path_stages)
            .selectinload(PathStage.stage_template)
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
                    .join(Project.project_paths)
                    .join(ProjectPath.path)
                    .join(Path.path_stages)
                    .join(PathStage.stage_template)
                    .where(StageTemplate.name.ilike(f'%{filters.stage_name}%'))
                )
                statement = statement.where(Project.id.in_(stage_subquery))

            if filters.freelancer_name is not None:
                freelancer_subquery = (
                    select(Project.id)
                    .join(Project.project_paths)
                    .join(ProjectPath.executions)
                    .join(
                        Employee,
                        ProjectStage.freelancer_id == Employee.id,
                    )
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

    async def count_by_stage_statuses(
        self,
    ) -> list[tuple[list[str] | None, int]]:
        """Conta projetos agrupados pelo conjunto de status das etapas.

        Projetos sem etapas aparecem com o conjunto ``None``.
        """
        stage_status = cast(ProjectStage.status, String)
        statuses = func.array_agg(
            aggregate_order_by(distinct(stage_status), stage_status)
        ).filter(ProjectStage.id.is_not(None))
        statuses_by_project = (
            select(statuses.label('statuses'))
            .select_from(Project)
            .outerjoin(ProjectPath, ProjectPath.project_id == Project.id)
            .outerjoin(
                ProjectStage, ProjectStage.project_path_id == ProjectPath.id
            )
            .group_by(Project.id)
            .subquery()
        )
        result = await self.session.execute(
            select(statuses_by_project.c.statuses, func.count()).group_by(
                statuses_by_project.c.statuses
            )
        )

        return [(statuses, count) for statuses, count in result.all()]

    async def update(self, project: Project) -> Project:
        await self.session.commit()
        await self.session.refresh(project)

        return project

    async def delete(self, project: Project) -> None:
        await self.session.delete(project)
        await self.session.commit()
