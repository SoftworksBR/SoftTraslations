from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import Roles
from src.models.employee_model import Employee
from src.models.path_model import Path
from src.models.stage_model import Stage
from src.repositories.path_repository import PathRepository
from src.schemas.path_schema import PathCreate


class PathService:
    def __init__(self, session: AsyncSession):
        self.repository = PathRepository(session)

    async def create(
        self, data: PathCreate, current_employee: Employee
    ) -> Path:
        self._require_projects_role(current_employee)

        path = Path(name=data.name)
        path.stages.extend(
            Stage(
                path=path,
                freelancer_id=stage.freelancer_id,
                status=stage.status,
            )
            for stage in data.stages
        )

        return await self.repository.create(path)

    async def get_all(self, current_employee: Employee) -> list[Path]:
        self._require_projects_role(current_employee)

        return await self.repository.get_all()

    @staticmethod
    def _require_projects_role(current_employee: Employee) -> None:
        if current_employee.role != Roles.PROJETOS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only projetos can use this endpoint',
            )
