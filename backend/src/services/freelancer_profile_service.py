from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import EmployeeStatus, Roles
from src.models.employee_model import Employee
from src.models.freelancer_profile_model import FreelancerProfile
from src.repositories.employee_repository import EmployeeRepository
from src.repositories.freelancer_profile_repository import (
    FreelancerProfileRepository,
)
from src.repositories.language_repository import LanguageRepository
from src.repositories.service_repository import ServiceRepository
from src.schemas.freelancer_profile_schema import FreelancerProfileSchema


class FreelancerProfileService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = FreelancerProfileRepository(session)
        self.language_repository = LanguageRepository(session)
        self.service_repository = ServiceRepository(session)

    async def complete_profile(
        self,
        data: FreelancerProfileSchema,
        current_employee: Employee,
    ) -> Employee:
        if current_employee.role != Roles.FREELANCER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only freelancers can complete this profile',
            )
        if current_employee.status != EmployeeStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Freelancer profile is already complete',
            )

        employee = await EmployeeRepository.get_by_id(
            self.session, current_employee.id
        )
        if employee is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Employee not found',
            )
        if employee.status != EmployeeStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Freelancer profile is already complete',
            )

        source_languages = await self._get_active_languages(
            data.source_language_ids
        )
        target_languages = await self._get_active_languages(
            data.target_language_ids
        )
        native_languages = await self._get_active_languages(
            data.native_language_ids
        )
        services = await self._get_active_services(data.service_ids)

        profile = FreelancerProfile(
            employee_id=employee.id,
            salutation=data.salutation,
            academic_title=data.academic_title,
            job_function=data.job_function,
            timezone=data.timezone,
            source_languages=source_languages,
            target_languages=target_languages,
            native_languages=native_languages,
            services=services,
        )
        await self.repository.create(profile)

        # Fase 1 concluída: o cadastro passa a aguardar aprovação do
        # gestor, nunca é ativado automaticamente.
        employee.status = EmployeeStatus.UNDER_REVIEW

        # Este commit grava o perfil (só com flush até aqui) e o status
        # juntos; se falhar, nenhum dos dois fica salvo.
        return await EmployeeRepository.update(self.session, employee)

    async def _get_active_languages(self, language_ids: list[int]):
        languages = await self.language_repository.get_by_ids(language_ids)
        self._ensure_all_found_and_active(languages, language_ids, 'language')

        return languages

    async def _get_active_services(self, service_ids: list[int]):
        services = await self.service_repository.get_by_ids(service_ids)
        self._ensure_all_found_and_active(services, service_ids, 'service')

        return services

    @staticmethod
    def _ensure_all_found_and_active(items, requested_ids, label: str):
        found_ids = {item.id for item in items}
        missing_ids = set(requested_ids) - found_ids
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f'One or more {label} ids were not found',
            )

        inactive_ids = [item.id for item in items if not item.is_active]
        if inactive_ids:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f'One or more {label} ids are not active',
            )
