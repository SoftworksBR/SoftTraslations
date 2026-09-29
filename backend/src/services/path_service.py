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

        # O "IN" acima não garante nenhuma ordem específica de retorno, então
        # a lista é reordenada aqui para bater com a ordem escolhida em
        # data.stage_ids (a ordem em que o gestor selecionou os Stages).
        stages_by_id = {stage.id: stage for stage in stages}
        ordered_stages = [
            stages_by_id[stage_id] for stage_id in data.stage_ids
        ]

        path = Path(name=data.name)
        path.stages.extend(ordered_stages)

        return await self.repository.create(path)

    async def get_all(self, current_employee: Employee) -> list[Path]:
        self._require_projects_role(current_employee)

        return await self.repository.get_all()

    async def get_by_id(self, path_id: int) -> Path:
        path = await self.repository.get_by_id(path_id)

        if path is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Path not found',
            )

        return path

    async def delete(self, path_id: int, current_employee: Employee) -> None:
        self._require_projects_role(current_employee)

        path = await self.get_by_id(path_id)

        await self.repository.delete(path)

    @staticmethod
    def _require_projects_role(current_employee: Employee) -> None:
        if current_employee.role != Roles.PROJETOS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only projetos can use this endpoint',
            )
