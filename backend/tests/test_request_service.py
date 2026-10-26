import asyncio
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from src.database import get_session
from src.enums.enums import Roles
from src.main import app
from src.repositories.request_repository import RequestRepository
from src.schemas.request_schema import RequestSearchFilters
from src.security import get_current_employee
from src.services.request_service import RequestService


@pytest.mark.parametrize('role', [Roles.ATENDIMENTO, Roles.PROJETOS])
def test_atendimento_and_projetos_can_list_requests(role):
    service = RequestService(session=None)
    expected_requests = [SimpleNamespace(id=1)]

    class FakeRepository:
        def __init__(self, requests):
            self.requests = requests

        async def get_all(self, filters=None):
            return self.requests

    service.repository = FakeRepository(expected_requests)

    result = asyncio.run(service.get_all(
                SimpleNamespace(role=role), RequestSearchFilters()
            ))

    assert result == expected_requests


def test_projetos_can_list_requests_through_api(monkeypatch):
    employee = SimpleNamespace(role=Roles.PROJETOS)

    class FakeSession:
        def __init__(self):
            self.requests = []

    async def fake_session():
        yield FakeSession()

    async def fake_get_all(repository, filters=None):
        return repository.session.requests

    async def fake_current_employee():
        return employee

    monkeypatch.setattr(RequestRepository, 'get_all', fake_get_all)
    app.dependency_overrides[get_session] = fake_session
    app.dependency_overrides[get_current_employee] = fake_current_employee
    try:
        response = TestClient(app).get('/requests/')

        assert response.status_code == HTTPStatus.OK
        assert response.json() == []
    finally:
        app.dependency_overrides.pop(get_session, None)
        app.dependency_overrides.pop(get_current_employee, None)


@pytest.mark.parametrize('role', [Roles.ADMIN, Roles.FREELANCER])
def test_other_roles_cannot_list_requests(role):
    service = RequestService(session=None)

    with pytest.raises(HTTPException) as error:
        asyncio.run(service.get_all(
                SimpleNamespace(role=role), RequestSearchFilters()
            ))

    assert error.value.status_code == HTTPStatus.FORBIDDEN


@pytest.mark.parametrize('action', ['update', 'delete'])
def test_projetos_cannot_modify_or_delete_requests(action):
    service = RequestService(session=None)
    employee = SimpleNamespace(role=Roles.PROJETOS)

    if action == 'update':
        operation = service.update(
            request_id=1,
            data=SimpleNamespace(
                username=None,
                email=None,
                phone=None,
                company=None,
                source_language_id=None,
                target_language_id=None,
                observations=None,
                employee_id=None,
            ),
            current_employee=employee,
        )
    else:
        operation = service.delete(
            request_id=1,
            current_employee=employee,
        )

    with pytest.raises(HTTPException) as error:
        asyncio.run(operation)

    assert error.value.status_code == HTTPStatus.FORBIDDEN
