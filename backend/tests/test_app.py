from http import HTTPStatus

from fastapi.testclient import TestClient

from src.main import app


def test_status_requires_authentication():
    client = TestClient(app)

    response = client.get('/')
    assert response.status_code == HTTPStatus.UNAUTHORIZED
