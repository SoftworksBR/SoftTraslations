from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.company_schema import CompanyCreate, CompanyFilter
from src.services.company_service import CompanyService


class CompanyController:
    @staticmethod
    async def create(
        data: CompanyCreate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = CompanyService(session)

        return await service.create(data, current_employee)

    @staticmethod
    async def get_by_id(
        company_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = CompanyService(session)

        return await service.get_by_id(company_id, current_employee)

    @staticmethod
    async def get_all(
        session: AsyncSession,
        current_employee: Employee,
        filters: CompanyFilter,
    ):
        service = CompanyService(session)

        return await service.get_all(current_employee, filters)
