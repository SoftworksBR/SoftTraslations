from datetime import UTC, datetime
from http import HTTPStatus

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.enums.enums import AccountStatus, Roles, Status
from src.models.employee_model import Employee
from src.models.path_model import Path
from src.models.project_model import Project, ProjectPath
from src.models.stage_model import PathStage, ProjectStage, StageTemplate
from src.repositories.stage_repository import StageRepository
from src.schemas.stage_schema import (
    ProjectStageCreate,
    StageSearchFilters,
    StageTemplateCreate,
    StageUpdate,
)
from src.services.outbox import enqueue_event


class StageService:
    def __init__(self, session: AsyncSession):
        self.repository = StageRepository(session)

    async def create(
        self, data: ProjectStageCreate, current_employee: Employee
    ) -> ProjectStage:
        self._require_projects_role(current_employee)
        project_path = await self.repository.session.get(
            ProjectPath, data.project_path_id
        )
        path_stage = await self.repository.session.get(
            PathStage, data.path_stage_id
        )
        if project_path is None or path_stage is None:
            raise HTTPException(
                status_code=HTTPStatus.NOT_FOUND,
                detail='Project path or path stage not found',
            )
        if project_path.path_id != path_stage.path_id:
            raise HTTPException(
                status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                detail='The stage does not belong to the project path',
            )

        await self._validate_freelancer(data.freelancer_id)
        duplicate = await self.repository.session.scalar(
            select(ProjectStage.id).where(
                ProjectStage.project_path_id == project_path.id,
                ProjectStage.path_stage_id == path_stage.id,
            )
        )
        if duplicate is not None:
            raise HTTPException(
                status_code=HTTPStatus.CONFLICT,
                detail='This stage already exists in the project path',
            )

        stage = ProjectStage(
            project_path_id=project_path.id,
            path_stage_id=path_stage.id,
            path_id=path_stage.path_id,
            freelancer_id=data.freelancer_id,
            status=Status.READY,
        )
        self.repository.session.add(stage)
        await self.repository.session.flush()
        enqueue_event(
            self.repository.session,
            event_type='project_stage.created',
            aggregate_type='project_stage',
            aggregate_id=stage.id,
            payload={
                'actor': self._actor(current_employee),
                'details': {
                    'status': stage.status.value,
                    'freelancer_id': stage.freelancer_id,
                },
                'source': 'api',
            },
        )
        return await self.repository.create(stage)

    async def create_template(
        self,
        data: StageTemplateCreate,
        current_employee: Employee,
    ) -> StageTemplate:
        self._require_projects_role(current_employee)
        template = StageTemplate(
            name=data.name,
            description=data.description,
        )
        self.repository.session.add(template)
        await self.repository.session.flush()
        enqueue_event(
            self.repository.session,
            event_type='stage_template.created',
            aggregate_type='stage_template',
            aggregate_id=template.id,
            payload={
                'actor': self._actor(current_employee),
                'details': {},
                'source': 'api',
            },
        )
        return await self.repository.create_template(template)

    async def get_templates(
        self, current_employee: Employee
    ) -> list[StageTemplate]:
        self._require_projects_role(current_employee)
        return await self.repository.get_templates()

    async def assign_path_to_project(
        self,
        project_id: int,
        path_id: int,
        current_employee: Employee,
    ) -> Path:
        self._require_projects_role(current_employee)
        project = await self.repository.session.get(Project, project_id)
        path = await self.repository.session.get(Path, path_id)
        if project is None or path is None:
            raise HTTPException(
                status_code=HTTPStatus.NOT_FOUND,
                detail='Project or path not found',
            )

        existing = await self.repository.session.scalar(
            select(ProjectPath.id).where(
                ProjectPath.project_id == project_id,
                ProjectPath.path_id == path_id,
            )
        )
        if existing is not None:
            return path

        current_sequence = await self.repository.session.scalar(
            select(func.max(ProjectPath.sequence)).where(
                ProjectPath.project_id == project_id
            )
        )
        project_path = ProjectPath(
            project_id=project_id,
            path_id=path_id,
            sequence=(current_sequence or 0) + 1,
        )
        self.repository.session.add(project_path)
        await self.repository.session.flush()

        path_stages = list(
            await self.repository.session.scalars(
                select(PathStage)
                .where(PathStage.path_id == path_id)
                .order_by(PathStage.sequence)
            )
        )
        self.repository.session.add_all(
            ProjectStage(
                project_path_id=project_path.id,
                path_stage_id=path_stage.id,
                path_id=path_id,
            )
            for path_stage in path_stages
        )
        enqueue_event(
            self.repository.session,
            event_type='project.path_assigned',
            aggregate_type='project',
            aggregate_id=project_id,
            payload={
                'actor': self._actor(current_employee),
                'details': {'path_id': path_id},
                'source': 'api',
            },
        )
        await self.repository.session.commit()
        return path

    async def get_by_id(self, stage_id: int) -> ProjectStage:
        stage = await self.repository.get_by_id(stage_id)
        if stage is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Stage not found',
            )
        return stage

    async def get_all(
        self,
        current_employee: Employee,
        filters: StageSearchFilters,
    ) -> list[ProjectStage]:
        if current_employee.role == Roles.PROJETOS:
            return await self.repository.get_all(filters=filters)

        if current_employee.role == Roles.FREELANCER:
            return await self.repository.get_all(
                freelancer_id=current_employee.id,
                filters=filters,
            )

        self._raise_stage_access_denied()

    async def update(
        self,
        stage_id: int,
        data: StageUpdate,
        current_employee: Employee,
    ) -> ProjectStage:
        if current_employee.role not in {Roles.PROJETOS, Roles.FREELANCER}:
            self._raise_stage_access_denied()

        stage = await self.get_by_id(stage_id)
        if current_employee.role == Roles.FREELANCER:
            if stage.freelancer_id != current_employee.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail='Freelancers can only update their own stages',
                )
            if data.freelancer_id is not None or data.status not in {
                Status.IN_PROGRESS,
                Status.TESTING,
                Status.DONE,
            }:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail='Freelancers can only advance their own stage',
                )
        elif data.freelancer_id is not None:
            await self._validate_freelancer(data.freelancer_id)
            stage.freelancer_id = data.freelancer_id

        previous_status = stage.status
        if data.status is not None:
            stage.status = data.status
            now = datetime.now(UTC)
            if data.status == Status.IN_PROGRESS and stage.started_at is None:
                stage.started_at = now
            if data.status == Status.DONE:
                if stage.started_at is None:
                    stage.started_at = now
                stage.completed_at = now

        if stage.status != previous_status or data.freelancer_id is not None:
            event_type = (
                'project_stage.completed'
                if stage.status == Status.DONE
                and previous_status != Status.DONE
                else 'project_stage.updated'
            )
            enqueue_event(
                self.repository.session,
                event_type=event_type,
                aggregate_type='project_stage',
                aggregate_id=stage.id,
                payload={
                    'actor': self._actor(current_employee),
                    'details': {
                        'status_before': previous_status.value,
                        'status_after': stage.status.value,
                        'freelancer_id': stage.freelancer_id,
                    },
                    'source': 'api',
                },
            )

        return await self.repository.update(stage)

    async def delete(self, stage_id: int, current_employee: Employee) -> None:
        self._require_projects_role(current_employee)
        stage = await self.get_by_id(stage_id)
        enqueue_event(
            self.repository.session,
            event_type='project_stage.deleted',
            aggregate_type='project_stage',
            aggregate_id=stage.id,
            payload={
                'actor': self._actor(current_employee),
                'details': {'status': stage.status.value},
                'source': 'api',
            },
        )
        await self.repository.delete(stage)

    async def _validate_freelancer(self, freelancer_id: int | None) -> None:
        if freelancer_id is None:
            return
        freelancer = await self.repository.session.scalar(
            select(Employee)
            .options(selectinload(Employee.freelancer_profile))
            .where(Employee.id == freelancer_id)
        )
        if (
            freelancer is None
            or freelancer.role != Roles.FREELANCER
            or freelancer.account_status != AccountStatus.ACTIVE
            or not freelancer.profile_completed
        ):
            raise HTTPException(
                status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                detail='The assigned employee is not an active freelancer',
            )

    @staticmethod
    def _actor(employee: Employee) -> dict:
        return {'employee_id': employee.id, 'role': employee.role.value}

    @staticmethod
    def _require_projects_role(current_employee: Employee) -> None:
        if current_employee.role != Roles.PROJETOS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only projetos can use this endpoint',
            )

    @staticmethod
    def _raise_stage_access_denied() -> None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Only projetos and freelancers can use this endpoint',
        )
