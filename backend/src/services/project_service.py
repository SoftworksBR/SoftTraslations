from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import QuoteStatus, Roles
from src.models.employee_model import Employee
from src.models.path_model import Path
from src.models.project_model import Project
from src.repositories.project_repository import ProjectRepository
from src.repositories.quote_repository import QuoteRepository
from src.schemas.project_schema import (
    ProjectCreate,
    ProjectSearchFilters,
    ProjectUpdate,
)


class ProjectService:
    def __init__(self, session: AsyncSession):
        self.repository = ProjectRepository(session)
        self.quote_repository = QuoteRepository(session)

    async def create(
        self, data: ProjectCreate, current_employee: Employee
    ) -> Project:
        self._require_projects_role(current_employee)

        paths = list(
            (
                await self.repository.session.scalars(
                    select(Path).where(Path.id.in_(set(data.path_ids)))
                )
            ).all()
        )
        if len(paths) != len(set(data.path_ids)):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='One or more paths were not found',
            )

        if data.quote_id is not None:
            await self._validate_quote(data.quote_id)

        project = Project(
            name=data.name,
            status=data.status,
            creator_id=current_employee.id,
            quote_id=data.quote_id,
            paths=paths,
        )

        return await self.repository.create(project)

    async def get_by_id(
        self, project_id: int, current_employee: Employee
    ) -> Project:
        self._require_project_reader_role(current_employee)

        project = await self.repository.get_by_id(project_id)

        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Project not found',
            )

        return project

    async def get_all(
        self,
        current_employee: Employee,
        filters: ProjectSearchFilters,
    ) -> list[Project]:
        self._require_projects_role(current_employee)

        return await self.repository.get_all(filters)

    async def update(
        self,
        project_id: int,
        data: ProjectUpdate,
        current_employee: Employee,
    ) -> Project:
        self._require_projects_role(current_employee)

        project = await self.repository.get_by_id(project_id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Project not found',
            )

        if data.name is not None:
            project.name = data.name

        if data.status is not None:
            project.status = data.status

        if data.creator_id is not None:
            project.creator_id = data.creator_id

        return await self.repository.update(project)

    async def delete(
        self, project_id: int, current_employee: Employee
    ) -> None:
        self._require_projects_role(current_employee)

        project = await self.repository.get_by_id(project_id)
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Project not found',
            )

        await self.repository.delete(project)

    async def _validate_quote(self, quote_id: int) -> None:
        quote = await self.quote_repository.get_by_id(quote_id)
        if quote is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Orçamento não encontrado',
            )

        if quote.status != QuoteStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Só é possível criar projeto de orçamento aprovado',
            )

        existing = await self.repository.session.scalar(
            select(Project.id).where(Project.quote_id == quote_id)
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Já existe projeto para este orçamento',
            )

    @staticmethod
    def _require_projects_role(current_employee: Employee) -> None:
        if current_employee.role != Roles.PROJETOS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only projetos can use this endpoint',
            )
