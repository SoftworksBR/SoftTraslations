from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.enums.enums import Roles, Status
from src.models.employee_model import Employee
from src.models.path_model import Path
from src.models.project_model import Project, ProjectPath
from src.models.stage_model import (
    PathStage,
    ProjectStage,
    Stage,
    StageTemplate,
)
from src.repositories.stage_repository import StageRepository
from src.schemas.stage_schema import (
    StageCreate,
    StageSearchFilters,
    StageUpdate,
)


class StageService:
    def __init__(self, session: AsyncSession):
        self.repository = StageRepository(session)

    async def create(
        self, data: StageCreate, current_employee: Employee
    ) -> StageTemplate:
        self._require_projects_role(current_employee)

        return await self.repository.create_template(
            StageTemplate(name=data.name)
        )

    async def assign_path_to_project(
        self,
        project_id: int,
        path_id: int,
        current_employee: Employee,
    ) -> Path:
        if current_employee.role != Roles.PROJETOS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only projetos can use this endpoint',
            )

        project = await self.repository.session.scalar(
            select(Project)
            .options(selectinload(Project.project_paths))
            .where(Project.id == project_id)
        )
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Project not found',
            )

        path = await self.repository.session.scalar(
            select(Path)
            .options(
                selectinload(Path.path_stages),
                selectinload(Path.project_paths),
            )
            .where(Path.id == path_id)
        )
        if path is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Path not found',
            )

        if not any(
            project_path.path_id == path.id
            for project_path in project.project_paths
        ):
            project_path = ProjectPath(
                path_id=path.id,
                sequence=len(project.project_paths) + 1,
            )
            project_path.path = path
            project.project_paths.append(project_path)
            self.repository.session.add(project_path)
            await self.repository.session.flush()
            self.repository.session.add_all([
                ProjectStage(
                    project_path_id=project_path.id,
                    path_stage_id=path_stage.id,
                    path_id=path_stage.path_id,
                )
                for path_stage in path.path_stages
            ])

        await self.repository.session.commit()

        return await self.repository.session.scalar(
            select(Path)
            .options(
                selectinload(Path.path_stages).selectinload(
                    PathStage.stage_template
                )
            )
            .where(Path.id == path.id)
        )

    async def get_by_id(self, stage_id: int) -> Stage:

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
    ) -> list[Stage]:
        if current_employee.role == Roles.PROJETOS:
            return await self.repository.get_all(
                filters=filters,
            )

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
    ) -> Stage:
        if current_employee.role not in {Roles.PROJETOS, Roles.FREELANCER}:
            self._raise_stage_access_denied()

        stage = await self.get_by_id(stage_id)

        if current_employee.role == Roles.PROJETOS:
            pass
        elif current_employee.role == Roles.FREELANCER:
            if stage.freelancer_id != current_employee.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail='Freelancers can only update their own stages',
                )
            if (
                data.freelancer_id is not None
                or data.name is not None
                or data.status not in {Status.IN_PROGRESS, Status.TESTING}
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        'Freelancers can only update their stage status '
                        'to in_progress or testing'
                    ),
                )
        else:
            self._raise_stage_access_denied()

        if data.freelancer_id is not None:
            stage.freelancer_id = data.freelancer_id

        if data.name is not None:
            stage.path_stage.stage_template.name = data.name

        if data.status is not None:
            stage.status = data.status

        return await self.repository.update(stage)

    async def delete(self, stage_id: int, current_employee: Employee) -> None:
        self._require_projects_role(current_employee)

        stage = await self.get_by_id(stage_id)

        await self.repository.delete(stage)

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
