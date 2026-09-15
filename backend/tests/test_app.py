from fastapi.testclient import TestClient

from src.main import app


def test_status_positivo():
    client = TestClient(app)

    response = client.get('/')
    assert response.json() == {'message': 'API is running'}
