import asyncio
from http import HTTPStatus
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from src.enums.enums import Roles, StageStatus
from src.models.stage_model import ProjectStage
from src.repositories.stage_repository import StageRepository
from src.schemas.stage_schema import StageUpdate
from src.services.stage_service import StageService

ASSIGNED_FREELANCER_ID = 7
OTHER_FREELANCER_ID = 8
STAGE_ID = 10


def make_stage(**overrides):
    values = {
        'project_path_id': 1,
        'path_stage_id': 2,
        'path_id': 3,
        'freelancer_id': ASSIGNED_FREELANCER_ID,
    }
    values.update(overrides)
    stage = ProjectStage(**values)
    stage.id = STAGE_ID
    return stage


def make_service(monkeypatch, stage):
    async def get_by_id(self, stage_id):
        assert stage_id == stage.id
        return stage

    async def update(self, updated_stage):
        return updated_stage

    monkeypatch.setattr(StageService, 'get_by_id', get_by_id)
    monkeypatch.setattr(StageRepository, 'update', update)
    return StageService(SimpleNamespace())


def freelancer(employee_id=7):
    return SimpleNamespace(id=employee_id, role=Roles.FREELANCER)


def test_new_project_stage_defaults_to_no_freelancer_status():
    stage = make_stage(freelancer_id=None)

    assert stage.status == StageStatus.NO_FREELANCER


def test_assigned_freelancer_can_accept_stage(monkeypatch):
    stage = make_stage()
    result = asyncio.run(
        make_service(monkeypatch, stage).accept(stage.id, freelancer())
    )

    assert result.status == StageStatus.IN_PROGRESS
    assert result.started_at is not None
    assert result.freelancer_id == ASSIGNED_FREELANCER_ID


def test_assigned_freelancer_can_decline_without_changing_status(monkeypatch):
    stage = make_stage()
    events = []
    monkeypatch.setattr(
        'src.services.stage_service.enqueue_event',
        lambda session, **event: events.append(event),
    )
    result = asyncio.run(
        make_service(monkeypatch, stage).decline(stage.id, freelancer())
    )

    assert result.freelancer_id is None
    assert result.status == StageStatus.NO_FREELANCER
    assert events[0]['event_type'] == 'project_stage.declined'
    assert (
        events[0]['payload']['details']['freelancer_id']
        == ASSIGNED_FREELANCER_ID
    )


def test_only_assigned_freelancer_can_accept_stage(monkeypatch):
    stage = make_stage()
    service = make_service(monkeypatch, stage)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            service.accept(
                stage.id, freelancer(employee_id=OTHER_FREELANCER_ID)
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN


def test_available_freelancers_excludes_ids_in_mongo_and_pending_outbox(
    monkeypatch,
):
    class FakeCollection:
        @staticmethod
        async def distinct(field, query):
            assert field == 'details.freelancer_id'
            assert query['entity.id'] == STAGE_ID
            return [ASSIGNED_FREELANCER_ID]

    class FakeDatabase:
        def __getitem__(self, collection_name):
            assert collection_name == 'audit_logs'
            return FakeCollection()

    class FakeMongoClient:
        def __init__(self, *args, **kwargs):
            pass

        def __getitem__(self, database_name):
            assert database_name
            return FakeDatabase()

        async def close(self):
            pass

    declined_employee = SimpleNamespace(
        id=ASSIGNED_FREELANCER_ID,
        profile_completed=True,
    )
    remaining_employee = SimpleNamespace(id=9, profile_completed=True)
    pending_employee = SimpleNamespace(id=11, profile_completed=True)
    session = SimpleNamespace(
        scalars=AsyncMock(
            side_effect=[
                [
                    {'details': {'freelancer_id': 11}},
                ],
                [
                    declined_employee,
                    remaining_employee,
                    pending_employee,
                ],
            ]
        )
    )
    monkeypatch.setattr(
        'src.services.stage_service.AsyncMongoClient', FakeMongoClient
    )
    service = StageService(session)
    monkeypatch.setattr(
        service,
        'get_by_id',
        AsyncMock(return_value=make_stage()),
    )

    available = asyncio.run(
        service.get_available_freelancers(
            10, SimpleNamespace(role=Roles.PROJETOS)
        )
    )

    assert [employee.id for employee in available] == [9]


def test_manager_cannot_reassign_declined_freelancer(monkeypatch):
    stage = make_stage(freelancer_id=None)
    service = make_service(monkeypatch, stage)
    monkeypatch.setattr(
        service,
        '_validate_freelancer',
        AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        service,
        '_get_declined_freelancer_ids',
        AsyncMock(return_value={ASSIGNED_FREELANCER_ID}),
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            service.update(
                stage.id,
                StageUpdate(freelancer_id=ASSIGNED_FREELANCER_ID),
                SimpleNamespace(id=1, role=Roles.PROJETOS),
            )
        )

    assert error.value.status_code == HTTPStatus.CONFLICT
