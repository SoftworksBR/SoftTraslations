from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import Roles
from src.models.employee_model import Employee
from src.models.path_model import Path
from src.models.stage_model import PathStage, StageTemplate
from src.repositories.path_repository import PathRepository
from src.schemas.path_schema import PathCreate
from src.services.outbox import enqueue_event


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
                    select(StageTemplate).where(
                        StageTemplate.id.in_(data.stage_ids)
                    )
                )
            ).all()
        )
        if len(stages) != len(data.stage_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='One or more stages were not found',
            )
        path = Path(name=data.name)
        stages_by_id = {stage.id: stage for stage in stages}
        path.path_stages.extend(
            PathStage(
                stage_template_id=stages_by_id[stage_id].id,
                sequence=sequence,
            )
            for sequence, stage_id in enumerate(data.stage_ids, start=1)
        )

        self.repository.session.add(path)
        await self.repository.session.flush()
        enqueue_event(
            self.repository.session,
            event_type='path.created',
            aggregate_type='path',
            aggregate_id=path.id,
            payload={
                'actor': {'employee_id': current_employee.id},
                'details': {'stage_template_ids': data.stage_ids},
                'source': 'api',
            },
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
