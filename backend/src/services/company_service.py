from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import Roles
from src.models.company_model import Company, Contact, Department
from src.models.employee_model import Employee
from src.repositories.company_repository import CompanyRepository
from src.schemas.company_schema import CompanyCreate, CompanyFilter


class CompanyService:
    def __init__(self, session: AsyncSession):
        self.repository = CompanyRepository(session)

    async def create(
        self, data: CompanyCreate, current_employee: Employee
    ) -> Company:
        self._require_atendimento_role(current_employee)

        if await self.repository.get_by_cnpj(data.cnpj) is not None:
            raise self._cnpj_already_registered()

        company = Company(
            name=data.name,
            cnpj=data.cnpj,
            departments=[
                Department(
                    name=department.name,
                    contacts=[
                        Contact(
                            name=contact.name,
                            email=contact.email,
                            phone=contact.phone,
                            job_title=contact.job_title,
                        )
                        for contact in department.contacts
                    ],
                )
                for department in data.departments
            ],
        )

        try:
            return await self.repository.create(company)
        except IntegrityError:
            raise self._cnpj_already_registered() from None

    async def get_by_id(
        self, company_id: int, current_employee: Employee
    ) -> Company:
        self._require_atendimento_role(current_employee)

        company = await self.repository.get_by_id(company_id)

        if company is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Empresa não encontrada',
            )

        return company

    async def get_all(
        self,
        current_employee: Employee,
        filters: CompanyFilter,
    ) -> list[Company]:
        self._require_atendimento_role(current_employee)

        return await self.repository.get_all(filters)

    @staticmethod
    def _cnpj_already_registered() -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='Já existe uma empresa cadastrada com este CNPJ.',
        )

    @staticmethod
    def _require_atendimento_role(current_employee: Employee) -> None:
        if current_employee.role != Roles.ATENDIMENTO:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Apenas o atendimento pode gerenciar empresas',
            )
