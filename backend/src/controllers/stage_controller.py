from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.stage_schema import StageCreate, StageUpdate
from src.services.stage_service import StageService


class StageController:
    @staticmethod
    async def create(
        data: StageCreate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = StageService(session)

        return await service.create(data, current_employee)

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
    async def get_all(
        session: AsyncSession,
        name: str | None = None,
        status=None,
        project_name: str | None = None,
        freelancer_name: str | None = None,
    ):
        service = StageService(session)

        return await service.get_all(
            name=name,
            status=status,
            project_name=project_name,
            freelancer_name=freelancer_name,
        )

    @staticmethod
    async def update(
        stage_id: int,
        data: StageUpdate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = StageService(session)

        return await service.update(stage_id, data, current_employee)

    @staticmethod
    async def delete(
        stage_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = StageService(session)

        await service.delete(stage_id, current_employee)
