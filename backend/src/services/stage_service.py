from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.enums.enums import Roles, Status
from src.models.employee_model import Employee
from src.models.project_model import Project
from src.models.stage_model import Stage
from src.repositories.stage_repository import StageRepository
from src.schemas.stage_schema import (
    StageCreate,
    StageUpdate,
)


class StageService:
    def __init__(self, session: AsyncSession):
        self.repository = StageRepository(session)

    async def create(
        self, data: StageCreate, current_employee: Employee
    ) -> Stage:
        self._require_projects_role(current_employee)

        return await self._create_for_project(
            data.project_id,
            data.freelancer_id,
            data.status,
        )

    async def assign_to_project(
        self,
        project_id: int,
        stage_id: int,
        current_employee: Employee,
    ) -> Stage:
        if current_employee.role != Roles.PROJETOS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only projetos can use this endpoint',
            )

        project = await self.repository.session.scalar(
            select(Project)
            .options(selectinload(Project.stages))
            .where(Project.id == project_id)
        )
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Project not found',
            )

        stage = await self.repository.get_by_id(stage_id)
        if stage is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Stage not found',
            )

        if stage not in project.stages:
            project.stages.append(stage)

        return await self.repository.assign_to_project(stage)

    async def _create_for_project(
        self,
        project_id: int,
        freelancer_id: int,
        stage_status: Status,
    ) -> Stage:
        project = await self.repository.session.scalar(
            select(Project).where(Project.id == project_id)
        )
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Project not found',
            )

        freelancer = await self.repository.session.scalar(
            select(Employee).where(Employee.id == freelancer_id)
        )
        if freelancer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Freelancer not found',
            )

        stage = Stage(freelancer_id=freelancer_id, status=stage_status)
        stage.projects.append(project)

        return await self.repository.create(stage)

    async def get_by_id(self, stage_id: int) -> Stage:

        stage = await self.repository.get_by_id(stage_id)

        if stage is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Stage not found',
            )

        return stage

    async def get_all(self, current_employee: Employee) -> list[Stage]:
        if current_employee.role == Roles.PROJETOS:
            return await self.repository.get_all()

        if current_employee.role == Roles.FREELANCER:
            return await self.repository.get_all(current_employee.id)

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
                or data.status
                not in {Status.IN_PROGRESS, Status.TESTING}
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
