import asyncio
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError
from starlette.requests import Request

from src.controllers.auth_controller import AuthController
from src.database import get_session
from src.main import app
from src.security import create_access_token, get_current_employee, settings
from src.settings import Settings


def test_status_requires_authentication():
    client = TestClient(app)

    response = client.get('/')
    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_cors_allows_credentials_from_configured_frontend():
    client = TestClient(app)
    response = client.options(
        '/auth/me',
        headers={
            'Origin': 'http://localhost:8081',
            'Access-Control-Request-Method': 'GET',
        },
    )

    assert response.status_code == HTTPStatus.OK
    assert response.headers['access-control-allow-credentials'] == 'true'
    assert (
        response.headers['access-control-allow-origin']
        == 'http://localhost:8081'
    )


def test_cross_site_cookie_requires_secure_transport():
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            COOKIE_SECURE=False,
            COOKIE_SAMESITE='none',
        )


def test_cookie_name_can_be_configured():
    configured_settings = Settings(
        _env_file=None,
        ACCESS_TOKEN_COOKIE_NAME='custom_access_token',
    )

    assert (
        configured_settings.ACCESS_TOKEN_COOKIE_NAME == 'custom_access_token'
    )


def test_login_sets_http_only_cookie_and_logout_clears_it(monkeypatch):
    employee = SimpleNamespace(email='user@example.com')
    access_token = create_access_token({'sub': employee.email})

    async def fake_login(self, form_data, session):
        return {
            'access_token': access_token,
            'token_type': 'bearer',
        }

    class FakeSession:
        def __init__(self):
            self.employee = employee

        async def scalar(self, query):
            return self.employee

    async def fake_session():
        yield FakeSession()

    monkeypatch.setattr(AuthController, 'login', fake_login)
    app.dependency_overrides[get_session] = fake_session
    try:
        client = TestClient(app)
        login_response = client.post(
            '/auth/',
            data={'username': 'user@example.com', 'password': 'password'},
        )
        cookie = login_response.cookies.get(settings.ACCESS_TOKEN_COOKIE_NAME)

        assert login_response.status_code == HTTPStatus.OK
        assert cookie == access_token
        assert login_response.json() == {'token_type': 'bearer'}
        assert 'httponly' in login_response.headers['set-cookie'].lower()
        assert 'samesite=lax' in login_response.headers['set-cookie'].lower()

        authenticated_response = client.get('/')
        assert authenticated_response.status_code == HTTPStatus.OK

        logout_response = client.post('/auth/logout')

        assert logout_response.status_code == HTTPStatus.NO_CONTENT
        assert 'max-age=0' in logout_response.headers['set-cookie'].lower()
    finally:
        app.dependency_overrides.pop(get_session, None)


def test_status_accepts_authentication_cookie_and_bearer_token():
    employee = SimpleNamespace(email='user@example.com')

    class FakeSession:
        def __init__(self, authenticated_employee):
            self.authenticated_employee = authenticated_employee

        async def scalar(self, query):
            return self.authenticated_employee

    async def fake_session():
        yield FakeSession(employee)

    app.dependency_overrides[get_session] = fake_session
    try:
        client = TestClient(app)
        token = create_access_token({'sub': employee.email})
        cookie_response = client.get(
            '/',
            cookies={settings.ACCESS_TOKEN_COOKIE_NAME: token},
        )

        assert cookie_response.status_code == HTTPStatus.OK
        assert cookie_response.json() == {'message': 'API is running'}

        client.cookies.clear()
        bearer_response = client.get(
            '/',
            headers={'Authorization': f'Bearer {token}'},
        )
        assert bearer_response.status_code == HTTPStatus.OK
    finally:
        app.dependency_overrides.pop(get_session, None)


def test_cookie_auth_rejects_untrusted_origin_for_mutations():
    request = Request({
        'type': 'http',
        'method': 'POST',
        'headers': [(b'origin', b'https://untrusted.example')],
    })

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            get_current_employee(
                request=request,
                token=None,
                access_token_cookie='cookie-token',
                session=None,
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN
