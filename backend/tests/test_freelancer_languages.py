import asyncio
from datetime import date
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from src.enums.enums import EmployeeStatus, Roles
from src.main import app
from src.models.employee_model import Employee, FreelancerProfile
from src.models.language_model import Language
from src.repositories.employee_repository import EmployeeRepository
from src.repositories.language_repository import LanguageRepository
from src.schemas.employee_schema import (
    FreelancerLanguagesSchema,
    FreelancerProfileSchema,
)
from src.security import get_current_employee
from src.services.employee_service import EmployeeService

PORTUGUESE, ENGLISH, SPANISH = 1, 2, 3


def make_language(language_id, name):
    language = Language(name=name)
    language.id = language_id
    return language


CATALOG = {
    PORTUGUESE: make_language(PORTUGUESE, 'Português'),
    ENGLISH: make_language(ENGLISH, 'Inglês'),
    SPANISH: make_language(SPANISH, 'Espanhol'),
}


def ids(languages):
    return [language.id for language in languages]


def make_freelancer(profile_completed=True):
    return SimpleNamespace(
        id=7,
        role=Roles.FREELANCER,
        status=EmployeeStatus.AVAILABLE,
        freelancer_profile=SimpleNamespace(
            profile_completed=profile_completed,
            source_languages=[CATALOG[PORTUGUESE]],
            target_languages=[CATALOG[ENGLISH]],
        ),
    )


@pytest.fixture
def repositories(monkeypatch):
    async def get_by_ids(self, language_ids):
        return [CATALOG[i] for i in sorted(language_ids) if i in CATALOG]

    async def update(session, employee):
        return employee

    monkeypatch.setattr(LanguageRepository, 'get_by_ids', get_by_ids)
    monkeypatch.setattr(EmployeeRepository, 'update', update)

    def use_employee(employee):
        async def get_by_id(session, employee_id):
            return employee

        monkeypatch.setattr(EmployeeRepository, 'get_by_id', get_by_id)
        return employee

    return use_employee


def patch_languages(employee, **fields):
    return asyncio.run(
        EmployeeService.update_freelancer_languages(
            session=None,
            data=FreelancerLanguagesSchema(**fields),
            current_employee=employee,
        )
    )


def test_completing_profile_saves_languages(repositories):
    freelancer = repositories(make_freelancer(profile_completed=False))
    freelancer.freelancer_profile.source_languages = []
    freelancer.freelancer_profile.target_languages = []

    updated = asyncio.run(
        EmployeeService.complete_freelancer_profile(
            session=None,
            data=FreelancerProfileSchema(
                birth_date=date(1990, 1, 1),
                phone='+5511999999999',
                source_language_ids=[PORTUGUESE],
                target_language_ids=[ENGLISH, SPANISH],
            ),
            current_employee=freelancer,
        )
    )

    assert ids(updated.freelancer_profile.source_languages) == [PORTUGUESE]
    assert ids(updated.freelancer_profile.target_languages) == [
        ENGLISH,
        SPANISH,
    ]


def test_patch_replaces_languages(repositories):
    freelancer = repositories(make_freelancer())

    updated = patch_languages(
        freelancer,
        source_language_ids=[ENGLISH],
        target_language_ids=[PORTUGUESE, SPANISH],
    )

    assert ids(updated.freelancer_profile.source_languages) == [ENGLISH]
    assert ids(updated.freelancer_profile.target_languages) == [
        PORTUGUESE,
        SPANISH,
    ]


def test_patch_without_field_keeps_languages(repositories):
    freelancer = repositories(make_freelancer())

    updated = patch_languages(freelancer, target_language_ids=[SPANISH])

    assert ids(updated.freelancer_profile.source_languages) == [PORTUGUESE]
    assert ids(updated.freelancer_profile.target_languages) == [SPANISH]


def test_patch_with_empty_list_clears_languages(repositories):
    freelancer = repositories(make_freelancer())

    updated = patch_languages(freelancer, source_language_ids=[])

    assert updated.freelancer_profile.source_languages == []
    assert ids(updated.freelancer_profile.target_languages) == [ENGLISH]


def test_unknown_language_id_returns_422(repositories):
    freelancer = repositories(make_freelancer())

    with pytest.raises(HTTPException) as error:
        patch_languages(freelancer, target_language_ids=[ENGLISH, 999])

    assert error.value.status_code == HTTPStatus.UNPROCESSABLE_ENTITY
    assert ids(freelancer.freelancer_profile.target_languages) == [ENGLISH]


def test_duplicate_language_ids_are_ignored(repositories):
    freelancer = repositories(make_freelancer())

    updated = patch_languages(
        freelancer, target_language_ids=[SPANISH, SPANISH, ENGLISH]
    )

    assert ids(updated.freelancer_profile.target_languages) == [
        ENGLISH,
        SPANISH,
    ]


@pytest.mark.parametrize(
    'role', [Roles.ATENDIMENTO, Roles.PROJETOS, Roles.ADMIN]
)
def test_other_roles_cannot_patch_languages(role):
    with pytest.raises(HTTPException) as error:
        patch_languages(
            SimpleNamespace(id=1, role=role), source_language_ids=[1]
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN


def test_patch_requires_completed_profile(repositories):
    freelancer = repositories(make_freelancer(profile_completed=False))

    with pytest.raises(HTTPException) as error:
        patch_languages(freelancer, source_language_ids=[ENGLISH])

    assert error.value.status_code == HTTPStatus.FORBIDDEN


def get_me(employee):
    app.dependency_overrides[get_current_employee] = lambda: employee
    try:
        return TestClient(app).get('/auth/me').json()
    finally:
        app.dependency_overrides.clear()


def make_employee(role):
    employee = Employee(
        username=role.value,
        email=f'{role.value}@example.com',
        password_hash='hash',
        role=role,
    )
    employee.id = 1
    return employee


def test_auth_me_returns_freelancer_language_ids():
    freelancer = make_employee(Roles.FREELANCER)
    freelancer.freelancer_profile = FreelancerProfile(
        source_languages=[CATALOG[PORTUGUESE]],
        target_languages=[CATALOG[ENGLISH], CATALOG[SPANISH]],
    )

    body = get_me(freelancer)

    assert body['source_language_ids'] == [PORTUGUESE]
    assert body['target_language_ids'] == [ENGLISH, SPANISH]


@pytest.mark.parametrize(
    'role', [Roles.ADMIN, Roles.ATENDIMENTO, Roles.PROJETOS]
)
def test_auth_me_returns_empty_language_ids_for_other_roles(role):
    body = get_me(make_employee(role))

    assert body['source_language_ids'] == []
    assert body['target_language_ids'] == []


def make_freelancer_with_languages():
    freelancer = make_employee(Roles.FREELANCER)
    freelancer.freelancer_profile = FreelancerProfile(
        source_languages=[CATALOG[PORTUGUESE]],
        target_languages=[CATALOG[ENGLISH], CATALOG[SPANISH]],
    )
    return freelancer


def test_freelancer_language_ids_come_from_profile():
    freelancer = make_freelancer_with_languages()

    assert freelancer.source_language_ids == [PORTUGUESE]
    assert freelancer.target_language_ids == [ENGLISH, SPANISH]


@pytest.mark.parametrize(
    'role', [Roles.ADMIN, Roles.ATENDIMENTO, Roles.PROJETOS]
)
def test_language_ids_are_empty_after_role_change(role):
    employee = make_freelancer_with_languages()

    employee.role = role

    assert employee.source_language_ids == []
    assert employee.target_language_ids == []
    assert ids(employee.freelancer_profile.source_languages) == [PORTUGUESE]


def test_non_freelancer_without_profile_has_empty_language_ids():
    employee = make_employee(Roles.ATENDIMENTO)

    assert employee.freelancer_profile is None
    assert employee.source_language_ids == []
    assert employee.target_language_ids == []
