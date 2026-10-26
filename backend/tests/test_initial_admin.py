import asyncio
from types import SimpleNamespace

import pytest

from src.main import app
from src.repositories.employee_repository import EmployeeRepository
from src.services.employee_service import EmployeeService
from src.services.initial_admin import initialize_initial_admin
from src.settings import Settings


class FakeSession:
    @staticmethod
    async def execute(statement):
        return None


def test_temporary_admin_endpoint_is_not_registered():
    assert '/auth/register-admin' not in app.openapi()['paths']


def test_initial_admin_is_created_when_database_has_no_employees(monkeypatch):
    created = []

    async def get_employees(session, limit, offset, filters=None):
        return []

    async def create_initial_admin(session, employee):
        created.append(employee)
        return employee

    monkeypatch.setattr(EmployeeRepository, 'get_employees', get_employees)
    monkeypatch.setattr(
        EmployeeService,
        'create_initial_admin',
        create_initial_admin,
    )

    result = asyncio.run(
        initialize_initial_admin(
            session=FakeSession(),
            settings=Settings(
                _env_file=None,
                INITIAL_ADMIN_USERNAME='root',
                INITIAL_ADMIN_EMAIL='root@example.com',
                INITIAL_ADMIN_PASSWORD='strong-password',
            ),
        )
    )

    assert result is created[0]
    assert result.username == 'root'
    assert result.email == 'root@example.com'
    assert result.role.value == 'admin'


def test_initial_admin_is_not_created_when_database_has_employees(
    monkeypatch,
):
    async def get_employees(session, limit, offset, filters=None):
        return [SimpleNamespace(id=1)]

    async def create_initial_admin(session, employee):
        pytest.fail('Must not create a bootstrap admin in a populated DB')

    monkeypatch.setattr(EmployeeRepository, 'get_employees', get_employees)
    monkeypatch.setattr(
        EmployeeService,
        'create_initial_admin',
        create_initial_admin,
    )

    result = asyncio.run(
        initialize_initial_admin(
            session=FakeSession(),
            settings=Settings(_env_file=None),
        )
    )

    assert result is None


def test_empty_database_requires_initial_admin_environment(monkeypatch):
    async def get_employees(session, limit, offset, filters=None):
        return []

    monkeypatch.setattr(EmployeeRepository, 'get_employees', get_employees)

    with pytest.raises(RuntimeError, match='INITIAL_ADMIN_USERNAME'):
        asyncio.run(
            initialize_initial_admin(
                session=FakeSession(),
                settings=Settings(_env_file=None),
            )
        )
