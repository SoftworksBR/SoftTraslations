from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.company_model import Company, Department
from src.schemas.company_schema import CompanyFilter


class CompanyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    @staticmethod
    def _with_children(statement):
        return statement.options(
            selectinload(Company.departments).selectinload(Department.contacts)
        )

    async def create(self, company: Company) -> Company:
        self.session.add(company)

        try:
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise

        return await self.get_by_id(company.id)

    async def get_by_cnpj(self, cnpj: str) -> Company | None:
        result = await self.session.execute(
            select(Company).where(Company.cnpj == cnpj)
        )

        return result.scalar_one_or_none()

    async def get_by_id(self, company_id: int) -> Company | None:
        result = await self.session.execute(
            self._with_children(
                select(Company).where(Company.id == company_id)
            )
        )

        return result.scalar_one_or_none()

    async def get_all(self, filters: CompanyFilter) -> list[Company]:
        statement = select(Company)

        if filters.name is not None:
            statement = statement.where(
                Company.name.ilike(f'%{filters.name}%')
            )

        if filters.cnpj is not None:
            statement = statement.where(
                Company.cnpj.ilike(f'%{filters.cnpj}%')
            )

        result = await self.session.execute(
            self._with_children(
                statement
                .order_by(Company.id)
                .offset(filters.offset)
                .limit(filters.limit)
            )
        )

        return list(result.scalars().all())
