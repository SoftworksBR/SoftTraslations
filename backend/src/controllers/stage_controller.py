from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.stage_schema import StageCreate, StageUpdate
from src.services.stage_service import StageService


class StageController:
    @staticmethod
    async def create(data: StageCreate, session: AsyncSession):
        service = StageService(session)

        return await service.create(data)

    @staticmethod
    async def assign_to_project(
        project_id: int,
        stage_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = StageService(session)

        return await service.assign_to_project(
            project_id, stage_id, current_employee
        )

    @staticmethod
    async def get_by_id(stage_id: int, session: AsyncSession):
        service = StageService(session)

        return await service.get_by_id(stage_id)

    @staticmethod
    async def get_all(session: AsyncSession):
        service = StageService(session)

        return await service.get_all()

    @staticmethod
    async def update(stage_id: int, data: StageUpdate, session: AsyncSession):
        service = StageService(session)

        return await service.update(stage_id, data)

    @staticmethod
    async def delete(stage_id: int, session: AsyncSession):
        service = StageService(session)

        await service.delete(stage_id)
