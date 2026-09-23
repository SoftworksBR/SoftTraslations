from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import Roles
from src.models.employee_model import Employee
from src.models.project_model import Project
from src.repositories.project_repository import ProjectRepository
from src.schemas.project_schema import ProjectCreate, ProjectUpdate


class ProjectService:
    def __init__(self, session: AsyncSession):
        self.repository = ProjectRepository(session)

    async def create(
        self, data: ProjectCreate, current_employee: Employee
    ) -> Project:
        self._require_projects_role(current_employee)

        project = Project(
            name=data.name, status=data.status, creator_id=data.creator_id
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

    async def get_all(self, current_employee: Employee) -> list[Project]:
        self._require_project_reader_role(current_employee)

        return await self.repository.get_all()

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

    @staticmethod
    def _require_projects_role(current_employee: Employee) -> None:
        if current_employee.role != Roles.PROJETOS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only projetos can use this endpoint',
            )

    @staticmethod
    def _require_project_reader_role(current_employee: Employee) -> None:
        if current_employee.role not in {Roles.ADMIN, Roles.PROJETOS}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only admin and projetos can use this endpoint',
            )
