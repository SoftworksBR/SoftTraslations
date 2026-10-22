from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.stage_schema import (
    ProjectStageCreate,
    StageSearchFilters,
    StageTemplateCreate,
    StageUpdate,
)
from src.services.stage_service import StageService


class StageController:
    @staticmethod
    async def create(
        data: ProjectStageCreate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = StageService(session)

        return await service.create(data, current_employee)

    @staticmethod
    async def create_template(
        data: StageTemplateCreate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        return await StageService(session).create_template(
            data, current_employee
        )

    @staticmethod
    async def get_templates(session: AsyncSession, current_employee: Employee):
        return await StageService(session).get_templates(current_employee)

    @staticmethod
    async def assign_path_to_project(
        project_id: int,
        path_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = StageService(session)

        return await service.assign_path_to_project(
            project_id, path_id, current_employee
        )

    @staticmethod
    async def get_all(
        session: AsyncSession,
        current_employee: Employee,
        filters: StageSearchFilters,
    ):
        service = StageService(session)

        return await service.get_all(current_employee, filters)

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
