import asyncio
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from src.enums.enums import EmployeeStatus, Roles
from src.repositories.employee_repository import EmployeeRepository
from src.repositories.freelancer_profile_repository import (
    FreelancerProfileRepository,
)
from src.repositories.language_repository import LanguageRepository
from src.repositories.service_repository import ServiceRepository
from src.schemas.freelancer_profile_schema import FreelancerProfileSchema
from src.services.freelancer_profile_service import FreelancerProfileService


def _language(language_id: int, is_active: bool = True):
    return SimpleNamespace(id=language_id, is_active=is_active)


def _service(service_id: int, is_active: bool = True):
    return SimpleNamespace(id=service_id, is_active=is_active)


def _profile_data(**overrides):
    data = {
        'salutation': 'Sr.',
        'academic_title': 'Bacharel em Letras',
        'job_function': 'Tradutor técnico',
        'source_language_ids': [1],
        'target_language_ids': [2],
        'native_language_ids': [1],
        'service_ids': [10],
    }
    data.update(overrides)

    return FreelancerProfileSchema(**data)


def test_freelancer_profile_schema_defaults_timezone_to_sao_paulo():
    profile = _profile_data()

    assert profile.timezone == 'America/Sao_Paulo'


def test_freelancer_profile_schema_rejects_invalid_timezone():
    with pytest.raises(ValidationError):
        _profile_data(timezone='Not/A_Real_Zone')


@pytest.mark.parametrize(
    'field',
    [
        'source_language_ids',
        'target_language_ids',
        'native_language_ids',
        'service_ids',
    ],
)
def test_freelancer_profile_schema_requires_at_least_one_value(field):
    with pytest.raises(ValidationError):
        _profile_data(**{field: []})


def test_complete_profile_creates_profile_and_moves_to_under_review(
    monkeypatch,
):
    employee = SimpleNamespace(
        id=7,
        role=Roles.FREELANCER,
        status=EmployeeStatus.PENDING,
    )
    created_profiles = []
    updated_employees = []

    async def get_by_id(session, employee_id):
        return employee

    async def update(session, updated_employee):
        updated_employees.append(updated_employee)
        return updated_employee

    async def get_by_ids(self, ids):
        if self is language_repo_instance:
            return [_language(language_id) for language_id in ids]
        return [_service(service_id) for service_id in ids]

    async def create(self, profile):
        created_profiles.append(profile)
        return profile

    monkeypatch.setattr(EmployeeRepository, 'get_by_id', get_by_id)
    monkeypatch.setattr(EmployeeRepository, 'update', update)
    monkeypatch.setattr(LanguageRepository, 'get_by_ids', get_by_ids)
    monkeypatch.setattr(ServiceRepository, 'get_by_ids', get_by_ids)
    monkeypatch.setattr(FreelancerProfileRepository, 'create', create)

    service = FreelancerProfileService(session=None)
    language_repo_instance = service.language_repository

    updated_employee = asyncio.run(
        service.complete_profile(_profile_data(), current_employee=employee)
    )

    assert len(created_profiles) == 1
    assert created_profiles[0].employee_id == employee.id
    assert created_profiles[0].timezone == 'America/Sao_Paulo'
    assert updated_employee.status == EmployeeStatus.UNDER_REVIEW
    assert updated_employees == [employee]


def test_only_freelancers_can_complete_profile():
    service = FreelancerProfileService(session=None)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            service.complete_profile(
                _profile_data(),
                current_employee=SimpleNamespace(
                    id=1,
                    role=Roles.PROJETOS,
                    status=EmployeeStatus.PENDING,
                ),
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN


def test_cannot_complete_profile_twice(monkeypatch):
    service = FreelancerProfileService(session=None)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            service.complete_profile(
                _profile_data(),
                current_employee=SimpleNamespace(
                    id=1,
                    role=Roles.FREELANCER,
                    status=EmployeeStatus.AVAILABLE,
                ),
            )
        )

    assert error.value.status_code == HTTPStatus.CONFLICT


def test_rejects_unknown_language_id(monkeypatch):
    employee = SimpleNamespace(
        id=7, role=Roles.FREELANCER, status=EmployeeStatus.PENDING
    )

    async def get_by_id(session, employee_id):
        return employee

    async def get_languages(self, ids):
        # Só devolve o 1, o 2 "não existe".
        return [_language(1)]

    monkeypatch.setattr(EmployeeRepository, 'get_by_id', get_by_id)
    monkeypatch.setattr(LanguageRepository, 'get_by_ids', get_languages)

    service = FreelancerProfileService(session=None)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            service.complete_profile(
                _profile_data(source_language_ids=[1, 2]),
                current_employee=employee,
            )
        )

    assert error.value.status_code == HTTPStatus.NOT_FOUND


def test_rejects_inactive_service_id(monkeypatch):
    employee = SimpleNamespace(
        id=7, role=Roles.FREELANCER, status=EmployeeStatus.PENDING
    )

    async def get_by_id(session, employee_id):
        return employee

    async def get_languages(self, ids):
        return [_language(language_id) for language_id in ids]

    async def get_services(self, ids):
        return [_service(10, is_active=False)]

    monkeypatch.setattr(EmployeeRepository, 'get_by_id', get_by_id)
    monkeypatch.setattr(LanguageRepository, 'get_by_ids', get_languages)
    monkeypatch.setattr(ServiceRepository, 'get_by_ids', get_services)

    service = FreelancerProfileService(session=None)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            service.complete_profile(
                _profile_data(),
                current_employee=employee,
            )
        )

    assert error.value.status_code == HTTPStatus.UNPROCESSABLE_ENTITY
