from http import HTTPStatus

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.enums.enums import Roles
from src.models.company_model import Company, CompanyEmployee, Person
from src.models.employee_model import Employee
from src.schemas.company_schema import CompanyCreate, PersonCreate
from src.services.outbox import enqueue_event


class CompanyService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_company(
        self, data: CompanyCreate, current_employee: Employee
    ) -> Company:
        self._require_customer_manager(current_employee)
        company = Company(
            name=data.name.strip(),
            primary_email=str(data.primary_email),
            website=data.website,
            primary_phone=data.primary_phone,
            general_info=data.general_info,
            is_legal_entity=data.is_legal_entity,
            tax_id=data.tax_id,
            employees=[
                CompanyEmployee(
                    first_name=employee.first_name.strip(),
                    last_name=employee.last_name.strip(),
                    email=str(employee.email),
                    phone=employee.phone,
                    general_info=employee.general_info,
                )
                for employee in data.employees
            ],
        )
        self.session.add(company)
        try:
            await self.session.flush()
            enqueue_event(
                self.session,
                event_type='company.created',
                aggregate_type='company',
                aggregate_id=company.id,
                payload={
                    'actor': {'employee_id': current_employee.id},
                    'details': {
                        'employee_count': len(company.employees),
                        'is_legal_entity': company.is_legal_entity,
                    },
                    'source': 'api',
                },
            )
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise HTTPException(
                status_code=HTTPStatus.CONFLICT,
                detail='A company with this tax ID already exists',
            ) from exc
        return await self.get_company(company.id, current_employee)

    async def list_companies(
        self, current_employee: Employee
    ) -> list[Company]:
        self._require_customer_manager(current_employee)
        result = await self.session.scalars(
            select(Company)
            .options(selectinload(Company.employees))
            .order_by(Company.id)
        )
        return list(result)

    async def get_company(
        self, company_id: int, current_employee: Employee
    ) -> Company:
        self._require_customer_manager(current_employee)
        company = await self.session.scalar(
            select(Company)
            .options(selectinload(Company.employees))
            .where(Company.id == company_id)
        )
        if company is None:
            raise HTTPException(
                status_code=HTTPStatus.NOT_FOUND,
                detail='Company not found',
            )
        return company

    async def create_person(
        self, data: PersonCreate, current_employee: Employee
    ) -> Person:
        self._require_customer_manager(current_employee)
        person = Person(
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            email=str(data.email),
            phone=data.phone,
            general_info=data.general_info,
            is_natural_person=data.is_natural_person,
        )
        self.session.add(person)
        await self.session.flush()
        enqueue_event(
            self.session,
            event_type='person.created',
            aggregate_type='person',
            aggregate_id=person.id,
            payload={
                'actor': {'employee_id': current_employee.id},
                'details': {
                    'is_natural_person': person.is_natural_person,
                },
                'source': 'api',
            },
        )
        await self.session.commit()
        await self.session.refresh(person)
        return person

    async def list_people(self, current_employee: Employee) -> list[Person]:
        self._require_customer_manager(current_employee)
        result = await self.session.scalars(select(Person).order_by(Person.id))
        return list(result)

    @staticmethod
    def _require_customer_manager(current_employee: Employee) -> None:
        if current_employee.role != Roles.ATENDIMENTO:
            raise HTTPException(
                status_code=HTTPStatus.FORBIDDEN,
                detail='Only atendimento can manage customer records',
            )
