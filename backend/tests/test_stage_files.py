import asyncio
from http import HTTPStatus
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from src.enums.enums import Roles, StageStatus
from src.models.stage_model import ProjectStage
from src.repositories.stage_repository import StageRepository
from src.services.stage_service import StageService

FREELANCER_ID = 7
STAGE_ID = 10
FILE_ID = 12


def make_stage(**overrides):
    values = {
        'project_path_id': 1,
        'path_stage_id': 2,
        'path_id': 3,
        'freelancer_id': FREELANCER_ID,
        'status': StageStatus.TESTING,
    }
    values.update(overrides)
    stage = ProjectStage(**values)
    stage.id = STAGE_ID
    return stage


def make_file(file_path, uploaded_by_id=FREELANCER_ID):
    return SimpleNamespace(
        id=FILE_ID,
        file_path=str(file_path),
        original_name='delivery.pdf',
        uploaded_by_id=uploaded_by_id,
    )


def configure_file_service(monkeypatch, stage, file):
    async def get_by_id(self, stage_id):
        assert stage_id == stage.id
        return stage

    async def get_file(self, stage_id, file_id):
        assert stage_id == stage.id
        assert file_id == file.id
        return file

    monkeypatch.setattr(StageService, 'get_by_id', get_by_id)
    monkeypatch.setattr(StageRepository, 'get_file', get_file)
    session = SimpleNamespace(
        delete=AsyncMock(),
        commit=AsyncMock(),
        rollback=AsyncMock(),
    )
    return StageService(session), session


def test_assigned_freelancer_can_remove_uploaded_file_and_reopen_stage(
    tmp_path, monkeypatch
):
    path = tmp_path / 'delivery.pdf'
    path.write_text('delivery')
    stage = make_stage()
    file = make_file(path)
    service, session = configure_file_service(monkeypatch, stage, file)
    events = []
    monkeypatch.setattr(
        'src.services.stage_service.enqueue_event',
        lambda session, **event: events.append(event),
    )

    asyncio.run(
        service.delete_file(
            stage.id,
            file.id,
            SimpleNamespace(id=FREELANCER_ID, role=Roles.FREELANCER),
        )
    )

    assert not path.exists()
    assert stage.status == StageStatus.IN_PROGRESS
    session.delete.assert_awaited_once_with(file)
    session.commit.assert_awaited_once()
    assert events[0]['event_type'] == 'project_stage.file_removed'


def test_freelancer_cannot_remove_another_users_file(tmp_path, monkeypatch):
    path = tmp_path / 'delivery.pdf'
    path.write_text('delivery')
    stage = make_stage()
    file = make_file(path, uploaded_by_id=99)
    service, session = configure_file_service(monkeypatch, stage, file)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            service.delete_file(
                stage.id,
                file.id,
                SimpleNamespace(id=FREELANCER_ID, role=Roles.FREELANCER),
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN
    assert path.exists()
    session.delete.assert_not_awaited()
