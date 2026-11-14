import asyncio
from datetime import UTC, datetime
from http import HTTPStatus
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from src.database import get_session
from src.enums.enums import (
    AccountStatus,
    EmployeeStatus,
    Roles,
    StageCollaborationStatus,
    StageStatus,
)
from src.main import app
from src.models.stage_model import ProjectStage
from src.repositories.stage_repository import StageRepository
from src.schemas.stage_schema import StageUpdate
from src.security import get_current_employee
from src.services.stage_service import StageService


def test_new_stage_has_no_second_freelancer():
    stage = ProjectStage(project_path_id=1, path_stage_id=2, path_id=3)

    assert stage.second_freelancer_id is None
    assert stage.second_status is None


def test_second_freelancer_columns_match_migration():
    columns = ProjectStage.__table__.c
    (foreign_key,) = columns.second_freelancer_id.foreign_keys

    assert columns.second_freelancer_id.nullable
    assert foreign_key.target_fullname == 'employees.id'
    assert foreign_key.ondelete == 'SET NULL'
    assert columns.second_status.nullable
    assert columns.second_status.type.name == 'stage_collaboration_status'
    assert columns.second_status.type.enums == [
        status.value for status in StageCollaborationStatus
    ]


MAIN_ID, SECOND_ID, OTHER_ID, STAGE_ID = 7, 8, 9, 10
MANAGER = SimpleNamespace(id=1, role=Roles.PROJETOS)


def make_stage(**overrides):
    values = {
        'project_path_id': 1,
        'path_stage_id': 2,
        'path_id': 3,
        'freelancer_id': MAIN_ID,
        'status': StageStatus.IN_PROGRESS,
    }
    values.update(overrides)
    stage = ProjectStage(**values)
    stage.id = STAGE_ID
    return stage


def freelancer(employee_id):
    return SimpleNamespace(id=employee_id, role=Roles.FREELANCER)


@pytest.fixture
def events(monkeypatch):
    recorded = []
    monkeypatch.setattr(
        'src.services.stage_service.enqueue_event',
        lambda session, **event: recorded.append(event),
    )
    return recorded


def make_service(monkeypatch, stage, declined=()):
    expired = []
    session = SimpleNamespace(
        expire=lambda instance, attributes: expired.append(attributes)
    )
    service = StageService(session)
    service.expired = expired
    monkeypatch.setattr(service, 'get_by_id', AsyncMock(return_value=stage))
    monkeypatch.setattr(
        service,
        '_get_declined_freelancer_ids',
        AsyncMock(return_value=set(declined)),
    )
    monkeypatch.setattr(service, '_validate_freelancer', AsyncMock())

    async def update(self, updated_stage):
        return updated_stage

    monkeypatch.setattr(StageRepository, 'update', update)
    return service


def expect_error(call):
    with pytest.raises(HTTPException) as error:
        asyncio.run(call)
    return error.value.status_code


# --- convidar ---------------------------------------------------------


def test_manager_invites_second_freelancer(monkeypatch, events):
    stage = make_stage()
    service = make_service(monkeypatch, stage)

    result = asyncio.run(
        service.invite_collaborator(STAGE_ID, SECOND_ID, MANAGER)
    )

    assert result.second_freelancer_id == SECOND_ID
    assert result.second_status == StageCollaborationStatus.INVITED
    assert service.expired == [['second_freelancer']]
    (event,) = events
    assert event['event_type'] == 'project_stage.collaborator_invited'
    assert event['payload']['details'] == {'freelancer_id': SECOND_ID}
    assert event['payload']['actor']['employee_id'] == MANAGER.id


def test_invite_unknown_stage_returns_404(monkeypatch):
    service = StageService(SimpleNamespace())
    monkeypatch.setattr(
        StageRepository, 'get_by_id', AsyncMock(return_value=None)
    )

    status = expect_error(
        service.invite_collaborator(STAGE_ID, SECOND_ID, MANAGER)
    )

    assert status == HTTPStatus.NOT_FOUND


@pytest.mark.parametrize(
    'role', [Roles.ADMIN, Roles.ATENDIMENTO, Roles.FREELANCER]
)
def test_only_manager_invites_or_removes(monkeypatch, role):
    stage = make_stage(
        second_freelancer_id=SECOND_ID,
        second_status=StageCollaborationStatus.INVITED,
    )
    service = make_service(monkeypatch, stage)
    employee = SimpleNamespace(id=MAIN_ID, role=role)

    assert (
        expect_error(service.invite_collaborator(STAGE_ID, OTHER_ID, employee))
        == HTTPStatus.FORBIDDEN
    )
    assert (
        expect_error(service.remove_collaborator(STAGE_ID, employee))
        == HTTPStatus.FORBIDDEN
    )


@pytest.mark.parametrize(
    ('stage_values', 'chosen', 'declined'),
    [
        ({'freelancer_id': None}, SECOND_ID, ()),
        ({'status': StageStatus.DONE}, SECOND_ID, ()),
        (
            {
                'second_freelancer_id': OTHER_ID,
                'second_status': StageCollaborationStatus.INVITED,
            },
            SECOND_ID,
            (),
        ),
        ({}, MAIN_ID, ()),
        ({}, SECOND_ID, (SECOND_ID,)),
    ],
    ids=[
        'sem-principal',
        'etapa-concluida',
        'ja-tem-segundo',
        'escolhido-e-o-principal',
        'escolhido-ja-recusou',
    ],
)
def test_invite_conflicts_return_409(
    monkeypatch, events, stage_values, chosen, declined
):
    service = make_service(monkeypatch, make_stage(**stage_values), declined)

    status = expect_error(
        service.invite_collaborator(STAGE_ID, chosen, MANAGER)
    )

    assert status == HTTPStatus.CONFLICT
    assert events == []


def test_invite_inactive_freelancer_returns_422(monkeypatch, events):
    service = make_service(monkeypatch, make_stage())
    monkeypatch.setattr(
        service,
        '_validate_freelancer',
        AsyncMock(
            side_effect=HTTPException(
                status_code=HTTPStatus.UNPROCESSABLE_ENTITY
            )
        ),
    )

    status = expect_error(
        service.invite_collaborator(STAGE_ID, SECOND_ID, MANAGER)
    )

    assert status == HTTPStatus.UNPROCESSABLE_ENTITY
    assert events == []


# --- remover ----------------------------------------------------------


def test_manager_removes_second_freelancer(monkeypatch, events):
    stage = make_stage(
        second_freelancer_id=SECOND_ID,
        second_status=StageCollaborationStatus.ACCEPTED,
    )
    service = make_service(monkeypatch, stage)

    result = asyncio.run(service.remove_collaborator(STAGE_ID, MANAGER))

    assert result.second_freelancer_id is None
    assert result.second_status is None
    assert service.expired == [['second_freelancer']]
    (event,) = events
    assert event['event_type'] == 'project_stage.collaborator_removed'
    assert event['payload']['details'] == {'freelancer_id': SECOND_ID}


@pytest.mark.parametrize(
    'stage_values',
    [
        {
            'status': StageStatus.DONE,
            'second_freelancer_id': SECOND_ID,
            'second_status': StageCollaborationStatus.ACCEPTED,
        },
        {},
    ],
    ids=['etapa-concluida', 'sem-segundo'],
)
def test_remove_conflicts_return_409(monkeypatch, events, stage_values):
    service = make_service(monkeypatch, make_stage(**stage_values))

    status = expect_error(service.remove_collaborator(STAGE_ID, MANAGER))

    assert status == HTTPStatus.CONFLICT
    assert events == []


# --- aceitar e recusar --------------------------------------------------


def invited_stage():
    return make_stage(
        second_freelancer_id=SECOND_ID,
        second_status=StageCollaborationStatus.INVITED,
    )


def test_second_freelancer_accepts_invite(monkeypatch):
    service = make_service(monkeypatch, invited_stage())

    result = asyncio.run(
        service.accept_collaboration(STAGE_ID, freelancer(SECOND_ID))
    )

    assert result.second_status == StageCollaborationStatus.ACCEPTED
    assert result.second_freelancer_id == SECOND_ID


def test_second_freelancer_declines_invite(monkeypatch, events):
    service = make_service(monkeypatch, invited_stage())

    result = asyncio.run(
        service.decline_collaboration(STAGE_ID, freelancer(SECOND_ID))
    )

    assert result.second_freelancer_id is None
    assert result.second_status is None
    assert result.freelancer_id == MAIN_ID
    (event,) = events
    assert event['event_type'] == 'project_stage.declined'
    assert event['payload']['details']['freelancer_id'] == SECOND_ID
    assert event['payload']['details']['role'] == 'collaborator'


@pytest.mark.parametrize('action', ['accept', 'decline'])
@pytest.mark.parametrize(
    'employee',
    [freelancer(MAIN_ID), freelancer(OTHER_ID), MANAGER],
    ids=['principal', 'outro-tradutor', 'gestor'],
)
def test_only_invited_freelancer_answers(monkeypatch, action, employee):
    service = make_service(monkeypatch, invited_stage())
    method = getattr(service, f'{action}_collaboration')

    assert expect_error(method(STAGE_ID, employee)) == HTTPStatus.FORBIDDEN


@pytest.mark.parametrize('action', ['accept', 'decline'])
def test_answer_requires_pending_invite(monkeypatch, action):
    stage = make_stage(
        second_freelancer_id=SECOND_ID,
        second_status=StageCollaborationStatus.ACCEPTED,
    )
    service = make_service(monkeypatch, stage)
    method = getattr(service, f'{action}_collaboration')

    status = expect_error(method(STAGE_ID, freelancer(SECOND_ID)))

    assert status == HTTPStatus.CONFLICT


# --- atribuição do principal -------------------------------------------


def test_second_freelancer_cannot_become_main_freelancer(monkeypatch):
    service = make_service(monkeypatch, invited_stage())

    status = expect_error(
        service.update(STAGE_ID, StageUpdate(freelancer_id=SECOND_ID), MANAGER)
    )

    assert status == HTTPStatus.CONFLICT


# --- recusa como colaborador e candidatos --------------------------------


def test_declined_collaborator_is_not_a_candidate_again(monkeypatch, events):
    asyncio.run(
        make_service(monkeypatch, invited_stage()).decline_collaboration(
            STAGE_ID, freelancer(SECOND_ID)
        )
    )
    declined_payload = events[0]['payload']

    class FakeMongoClient:
        def __init__(self, *args, **kwargs):
            pass

        def __getitem__(self, name):
            return {
                'audit_logs': SimpleNamespace(
                    distinct=AsyncMock(return_value=[])
                )
            }

        async def close(self):
            pass

    monkeypatch.setattr(
        'src.services.stage_service.AsyncMongoClient', FakeMongoClient
    )
    candidates = [
        SimpleNamespace(
            id=employee_id,
            username=f'freelancer{employee_id}',
            email=f'freelancer{employee_id}@example.com',
            role=Roles.FREELANCER,
            status=EmployeeStatus.AVAILABLE,
            account_status=AccountStatus.ACTIVE,
            profile_completed=True,
            source_language_ids=[],
            target_language_ids=[],
        )
        for employee_id in (SECOND_ID, OTHER_ID)
    ]
    session = SimpleNamespace(
        scalars=AsyncMock(side_effect=[[declined_payload], candidates])
    )
    service = StageService(session)
    monkeypatch.setattr(service, 'get_by_id', AsyncMock(return_value=None))
    monkeypatch.setattr(
        StageRepository, 'get_request_for_stage', AsyncMock(return_value=None)
    )

    available = asyncio.run(
        service.get_available_freelancers(STAGE_ID, MANAGER)
    )

    assert [item.id for item in available] == [OTHER_ID]


# --- rotas --------------------------------------------------------------


def fake_session():
    return SimpleNamespace()


def stage_response():
    return SimpleNamespace(
        id=STAGE_ID,
        name='Tradução',
        project_path_id=1,
        path_stage_id=2,
        freelancer_id=MAIN_ID,
        status=StageStatus.IN_PROGRESS,
        created_at=datetime(2026, 11, 1, tzinfo=UTC),
        started_at=None,
        completed_at=None,
        rejection_comment=None,
        second_freelancer_id=SECOND_ID,
        second_freelancer_name='segundo',
        second_status=StageCollaborationStatus.INVITED,
        files=[],
    )


@pytest.mark.parametrize(
    ('method', 'path', 'service_method', 'body'),
    [
        (
            'post',
            '/stages/10/collaborator',
            'invite_collaborator',
            {'freelancer_id': 8},
        ),
        ('delete', '/stages/10/collaborator', 'remove_collaborator', None),
        (
            'post',
            '/stages/10/collaborator/accept',
            'accept_collaboration',
            None,
        ),
        (
            'post',
            '/stages/10/collaborator/decline',
            'decline_collaboration',
            None,
        ),
    ],
)
def test_collaborator_routes_call_service(
    monkeypatch, method, path, service_method, body
):
    mock = AsyncMock(return_value=stage_response())
    monkeypatch.setattr(StageService, service_method, mock)
    app.dependency_overrides[get_current_employee] = lambda: MANAGER
    app.dependency_overrides[get_session] = fake_session
    try:
        client = TestClient(app)
        response = (
            client.post(path, json=body)
            if method == 'post'
            else client.delete(path)
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == HTTPStatus.OK
    assert response.json()['second_freelancer_name'] == 'segundo'
    assert response.json()['second_status'] == 'invited'
    assert mock.await_args.args[0] == STAGE_ID
    if body:
        assert mock.await_args.args[1] == SECOND_ID
