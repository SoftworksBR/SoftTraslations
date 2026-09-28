from http import HTTPStatus

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from src.enums.enums import Status
from src.main import app
from src.schemas.stage_schema import StageCreate


def test_status_requires_authentication():
    client = TestClient(app)

    response = client.get('/')
    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_stage_create_requires_name():
    with pytest.raises(ValidationError):
        StageCreate(
            project_id=1,
            freelancer_id=2,
            status=Status.READY,
        )
