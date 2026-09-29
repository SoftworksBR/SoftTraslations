import asyncio
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from src.enums.enums import FreelancerType, Roles, Status
from src.models.employee_model import Employee
from src.repositories.stage_repository import StageRepository
from src.schemas.stage_schema import StageCreate
from src.services.stage_service import StageService


def test_stage_create_accepts_freelancer_type_only():
    stage = StageCreate(
        name='Revisão',
        status=Status.READY,
        freelancer_type=FreelancerType.REVISOR,
    )

    assert stage.freelancer_id is None
    assert stage.freelancer_type == FreelancerType.REVISOR


def test_stage_create_accepts_freelancer_id_only():
    stage = StageCreate(
        name='Tradução',
        status=Status.READY,
        freelancer_id=1,
    )

    assert stage.freelancer_id == 1
    assert stage.freelancer_type is None


def test_stage_create_accepts_both_freelancer_id_and_type():
    stage = StageCreate(
        name='Tradução',
        status=Status.READY,
        freelancer_id=1,
        freelancer_type=FreelancerType.TRADUTOR,
    )

    assert stage.freelancer_id == 1
    assert stage.freelancer_type == FreelancerType.TRADUTOR


def test_stage_create_requires_freelancer_id_or_type():
    with pytest.raises(ValidationError):
        StageCreate(name='Sem responsável', status=Status.READY)


def test_service_creates_stage_with_freelancer_type_only(monkeypatch):
    created_stages = []

    async def create(self, stage):
        created_stages.append(stage)
        return stage

    monkeypatch.setattr(StageRepository, 'create', create)

    service = StageService(session=None)

    stage = asyncio.run(
        service.create(
            StageCreate(
                name='Revisão',
                status=Status.READY,
                freelancer_type=FreelancerType.REVISOR,
            ),
            current_employee=SimpleNamespace(role=Roles.PROJETOS),
        )
    )

    assert created_stages == [stage]
    assert stage.freelancer_id is None
    assert stage.freelancer_type == FreelancerType.REVISOR


def test_service_creates_stage_with_freelancer_id_only(monkeypatch):
    async def fake_scalar(statement):
        return Employee(
            username='freelancer',
            email='freelancer@example.com',
            password='hash',
            role=Roles.FREELANCER,
        )

    async def create(self, stage):
        return stage

    monkeypatch.setattr(StageRepository, 'create', create)

    service = StageService(session=SimpleNamespace(scalar=fake_scalar))

    stage = asyncio.run(
        service.create(
            StageCreate(
                name='Tradução',
                status=Status.READY,
                freelancer_id=1,
            ),
            current_employee=SimpleNamespace(role=Roles.PROJETOS),
        )
    )

    assert stage.freelancer_id == 1
    assert stage.freelancer_type is None


def test_service_rejects_freelancer_id_that_does_not_exist(monkeypatch):
    async def fake_scalar(statement):
        return None

    service = StageService(session=SimpleNamespace(scalar=fake_scalar))

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            service.create(
                StageCreate(
                    name='Tradução',
                    status=Status.READY,
                    freelancer_id=999,
                ),
                current_employee=SimpleNamespace(role=Roles.PROJETOS),
            )
        )

    assert error.value.status_code == HTTPStatus.NOT_FOUND


def test_service_rejects_stage_without_freelancer_id_or_type():
    invalid_data = StageCreate.model_construct(
        name='Sem responsável',
        status=Status.READY,
        freelancer_id=None,
        freelancer_type=None,
    )

    service = StageService(session=None)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            service.create(
                invalid_data,
                current_employee=SimpleNamespace(role=Roles.PROJETOS),
            )
        )

    assert error.value.status_code == HTTPStatus.UNPROCESSABLE_ENTITY
