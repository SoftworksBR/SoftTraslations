from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.enums.enums import FreelancerType, Roles, Status
from src.models.employee_model import Employee
from src.models.path_model import Path
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

        return await self._create_stage(
            data.freelancer_id,
            data.freelancer_type,
            data.name,
            data.status,
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
            .options(selectinload(Project.paths))
            .where(Project.id == project_id)
        )
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Project not found',
            )

        path = await self.repository.session.scalar(
            select(Path)
            .options(selectinload(Path.projects))
            .where(Path.id == path_id)
        )
        if path is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Path not found',
            )

        if project not in path.projects:
            path.projects.append(project)

        await self.repository.session.commit()
        await self.repository.session.refresh(path)

        return path

    async def _create_stage(
        self,
        freelancer_id: int | None,
        freelancer_type: FreelancerType | None,
        name: str,
        stage_status: Status,
    ) -> Stage:
        if freelancer_id is None and freelancer_type is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Stage must have a freelancer_id or a freelancer_type',
            )

        if freelancer_id is not None:
            freelancer = await self.repository.session.scalar(
                select(Employee).where(Employee.id == freelancer_id)
            )
            if freelancer is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail='Freelancer not found',
                )

        stage = Stage(
            freelancer_id=freelancer_id,
            freelancer_type=freelancer_type,
            name=name,
            status=stage_status,
        )

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
                or data.freelancer_type is not None
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

        if data.freelancer_type is not None:
            stage.freelancer_type = data.freelancer_type

        if data.name is not None:
            stage.name = data.name

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
