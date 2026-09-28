from fastapi import HTTPException, status
from sqlalchemy import select
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

        stages = list(
            (
                await self.repository.session.scalars(
                    select(Stage).where(Stage.id.in_(data.stage_ids))
                )
            ).all()
        )
        if len(stages) != len(data.stage_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='One or more stages were not found',
            )
        path = Path(name=data.name)
        path.stages.extend(stages)

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
