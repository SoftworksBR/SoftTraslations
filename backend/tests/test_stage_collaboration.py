import asyncio
import io
import re
from datetime import UTC, datetime
from http import HTTPStatus
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException, UploadFile
from fastapi.testclient import TestClient
from sqlalchemy.dialects import postgresql

from src.database import get_session
from src.enums.enums import (
    AccountStatus,
    EmployeeStatus,
    Roles,
    StageCollaborationStatus,
    StageStatus,
)
from src.main import app
from src.models.employee_model import Employee
from src.models.file_model import File
from src.models.stage_model import PathStage, ProjectStage, StageTemplate
from src.repositories.stage_repository import StageRepository
from src.schemas.stage_schema import (
    StageResponse,
    StageSearchFilters,
    StageUpdate,
)
from src.security import get_current_employee
from src.services import stage_service
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
    # Completa o necessário para montar a StageResponse.
    stage.created_at = datetime(2026, 11, 1, tzinfo=UTC)
    path_stage = PathStage(stage_template_id=1, sequence=1)
    path_stage.stage_template = StageTemplate(name='Tradução')
    stage.path_stage = path_stage
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
    # Ordem das chamadas: trava, validações e gravação.
    calls = service.calls = []
    monkeypatch.setattr(service, 'get_by_id', AsyncMock(return_value=stage))

    async def lock(self, stage_id):
        calls.append('lock')
        return stage

    async def declined_ids(stage_id):
        calls.append('declined')
        return set(declined)

    async def validate(freelancer_id):
        calls.append('validate')

    monkeypatch.setattr(StageRepository, 'get_by_id_for_update', lock)
    monkeypatch.setattr(service, '_get_declined_freelancer_ids', declined_ids)
    monkeypatch.setattr(service, '_validate_freelancer', validate)

    async def update(self, updated_stage):
        calls.append('save')
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
        StageRepository, 'get_by_id_for_update', AsyncMock(return_value=None)
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
    # Oferta aberta: o principal e o segundo ainda não responderam.
    return make_stage(
        status=StageStatus.NO_FREELANCER,
        second_freelancer_id=SECOND_ID,
        second_status=StageCollaborationStatus.INVITED,
    )


def assert_offer_won_by(stage, winner_id, leaving_id, events):
    assert stage.freelancer_id == winner_id
    assert stage.status == StageStatus.IN_PROGRESS
    assert stage.started_at is not None
    assert stage.second_freelancer_id is None
    assert stage.second_status is None
    (event,) = [
        e for e in events if e['event_type'] == 'project_stage.offer_closed'
    ]
    assert event['payload']['details'] == {
        'freelancer_id': leaving_id,
        'kept_freelancer_id': winner_id,
    }
    assert event['payload']['actor']['employee_id'] == winner_id


def test_second_accepts_first_and_main_leaves_offer(monkeypatch, events):
    stage = invited_stage()
    service = make_service(monkeypatch, stage)

    asyncio.run(service.accept_collaboration(STAGE_ID, freelancer(SECOND_ID)))

    assert_offer_won_by(stage, SECOND_ID, MAIN_ID, events)


def test_main_accepts_first_and_second_leaves_offer(monkeypatch, events):
    stage = invited_stage()
    service = make_service(monkeypatch, stage)

    asyncio.run(service.accept(STAGE_ID, freelancer(MAIN_ID)))

    assert_offer_won_by(stage, MAIN_ID, SECOND_ID, events)


@pytest.mark.parametrize('route', ['accept', 'accept_collaboration'])
@pytest.mark.parametrize(
    ('winner_id', 'leaving_id'),
    [(MAIN_ID, SECOND_ID), (SECOND_ID, MAIN_ID)],
    ids=['principal', 'segundo'],
)
def test_both_accept_routes_serve_either_candidate(
    monkeypatch, events, route, winner_id, leaving_id
):
    stage = invited_stage()
    service = make_service(monkeypatch, stage)

    asyncio.run(getattr(service, route)(STAGE_ID, freelancer(winner_id)))

    assert_offer_won_by(stage, winner_id, leaving_id, events)


@pytest.mark.parametrize(
    ('first_id', 'late_id', 'late_route'),
    [
        (SECOND_ID, MAIN_ID, 'accept'),
        (MAIN_ID, SECOND_ID, 'accept_collaboration'),
    ],
    ids=['principal-chega-depois', 'segundo-chega-depois'],
)
def test_late_accept_gets_409_offer_taken(
    monkeypatch, events, first_id, late_id, late_route
):
    stage = invited_stage()
    service = make_service(monkeypatch, stage)
    asyncio.run(service.accept(STAGE_ID, freelancer(first_id)))

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            getattr(service, late_route)(STAGE_ID, freelancer(late_id))
        )

    assert error.value.status_code == HTTPStatus.CONFLICT
    assert error.value.detail == stage_service.OFFER_TAKEN_DETAIL
    assert stage.freelancer_id == first_id


OFFER_FIELDS = (
    'freelancer_id',
    'status',
    'started_at',
    'second_freelancer_id',
    'second_status',
)


def test_concurrent_accepts_only_one_wins(monkeypatch, events):
    # Cada pedido lê a sua cópia da linha, como duas sessões no banco.
    row = invited_stage()
    service = make_service(monkeypatch, row)
    row_lock = asyncio.Lock()

    async def read_row():
        snapshot = make_stage(
            **{field: getattr(row, field) for field in OFFER_FIELDS}
        )
        await asyncio.sleep(0)
        return snapshot

    # Simula o FOR UPDATE: a segunda leitura espera o commit da primeira.
    async def lock(self, stage_id):
        await row_lock.acquire()
        return await read_row()

    async def commit(self, updated_stage):
        for field in OFFER_FIELDS:
            setattr(row, field, getattr(updated_stage, field))
        if row_lock.locked():
            row_lock.release()
        return updated_stage

    async def unlocked_read(stage_id):
        return await read_row()

    monkeypatch.setattr(StageRepository, 'get_by_id_for_update', lock)
    monkeypatch.setattr(StageRepository, 'update', commit)
    monkeypatch.setattr(service, 'get_by_id', unlocked_read)

    async def both():
        return await asyncio.gather(
            service.accept(STAGE_ID, freelancer(MAIN_ID)),
            service.accept_collaboration(STAGE_ID, freelancer(SECOND_ID)),
            return_exceptions=True,
        )

    results = asyncio.run(both())

    failures = [r for r in results if isinstance(r, HTTPException)]
    assert len(failures) == 1
    assert failures[0].status_code == HTTPStatus.CONFLICT
    assert failures[0].detail == stage_service.OFFER_TAKEN_DETAIL
    assert_offer_won_by(row, MAIN_ID, SECOND_ID, events)


def test_manager_moving_stage_out_of_offer_closes_it(monkeypatch, events):
    stage = invited_stage()
    service = make_service(monkeypatch, stage)

    asyncio.run(
        service.update(
            STAGE_ID, StageUpdate(status=StageStatus.IN_PROGRESS), MANAGER
        )
    )

    assert stage.second_freelancer_id is None
    assert stage.second_status is None
    (closed,) = [
        e for e in events if e['event_type'] == 'project_stage.offer_closed'
    ]
    assert closed['payload']['details']['freelancer_id'] == SECOND_ID
    assert closed['payload']['actor']['employee_id'] == MANAGER.id


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


def declined_events(events):
    return [
        e['payload']['details']
        for e in events
        if e['event_type'] == 'project_stage.declined'
    ]


def test_second_declines_then_main_accepts(monkeypatch, events):
    stage = invited_stage()
    service = make_service(monkeypatch, stage)

    asyncio.run(service.decline_collaboration(STAGE_ID, freelancer(SECOND_ID)))
    assert stage.freelancer_id == MAIN_ID
    assert stage.status == StageStatus.NO_FREELANCER
    asyncio.run(service.accept(STAGE_ID, freelancer(MAIN_ID)))

    assert stage.freelancer_id == MAIN_ID
    assert stage.status == StageStatus.IN_PROGRESS
    # O segundo já tinha saído: não há oferta a encerrar.
    assert [e['event_type'] for e in events] == ['project_stage.declined']


def test_main_declines_then_promoted_second_accepts(monkeypatch, events):
    stage = invited_stage()
    service = make_service(monkeypatch, stage)

    asyncio.run(service.decline(STAGE_ID, freelancer(MAIN_ID)))
    assert stage.freelancer_id == SECOND_ID
    assert stage.second_freelancer_id is None
    assert stage.second_status is None
    assert stage.status == StageStatus.NO_FREELANCER
    assert declined_events(events) == [
        {
            'freelancer_id': MAIN_ID,
            'status': 'no_freelancer',
            'promoted_freelancer_id': SECOND_ID,
        }
    ]
    # A tela do segundo pode ainda usar a rota de colaborador.
    asyncio.run(service.accept_collaboration(STAGE_ID, freelancer(SECOND_ID)))

    assert stage.freelancer_id == SECOND_ID
    assert stage.status == StageStatus.IN_PROGRESS
    assert stage.started_at is not None


@pytest.mark.parametrize(
    'order',
    [(MAIN_ID, SECOND_ID), (SECOND_ID, MAIN_ID)],
    ids=['principal-recusa-primeiro', 'segundo-recusa-primeiro'],
)
def test_both_decline_and_stage_returns_to_no_freelancer(
    monkeypatch, events, order
):
    stage = invited_stage()
    service = make_service(monkeypatch, stage)
    routes = {
        MAIN_ID: service.decline,
        SECOND_ID: service.decline_collaboration,
    }

    for employee_id in order:
        asyncio.run(routes[employee_id](STAGE_ID, freelancer(employee_id)))

    assert stage.freelancer_id is None
    assert stage.second_freelancer_id is None
    assert stage.second_status is None
    assert stage.status == StageStatus.NO_FREELANCER
    # Os dois entram no filtro de recusas da etapa.
    assert [d['freelancer_id'] for d in declined_events(events)] == list(
        order
    )


def test_late_decline_gets_409_offer_taken(monkeypatch, events):
    stage = invited_stage()
    service = make_service(monkeypatch, stage)
    asyncio.run(service.accept(STAGE_ID, freelancer(MAIN_ID)))

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            service.decline_collaboration(STAGE_ID, freelancer(SECOND_ID))
        )

    assert error.value.status_code == HTTPStatus.CONFLICT
    assert error.value.detail == stage_service.OFFER_TAKEN_DETAIL
    assert declined_events(events) == []


@pytest.mark.parametrize('action', ['accept', 'decline'])
@pytest.mark.parametrize(
    'employee',
    [freelancer(OTHER_ID), MANAGER],
    ids=['outro-tradutor', 'gestor'],
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
    monkeypatch.setattr(
        service, 'get_by_id', AsyncMock(return_value=make_stage())
    )
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


# --- permissões do segundo tradutor ---------------------------------------


def accepted_stage(**overrides):
    values = {
        'second_freelancer_id': SECOND_ID,
        'second_status': StageCollaborationStatus.ACCEPTED,
    }
    values.update(overrides)
    return make_stage(**values)


def make_file(path, uploaded_by_id=SECOND_ID):
    return SimpleNamespace(
        id=12,
        file_path=str(path),
        original_name='entrega.pdf',
        uploaded_by_id=uploaded_by_id,
    )


def file_service(monkeypatch, stage, file=None):
    session = SimpleNamespace(
        add=lambda instance: setattr(instance, 'id', 12),
        flush=AsyncMock(),
        commit=AsyncMock(),
        refresh=AsyncMock(),
        rollback=AsyncMock(),
        delete=AsyncMock(),
    )
    service = StageService(session)
    monkeypatch.setattr(service, 'get_by_id', AsyncMock(return_value=stage))
    monkeypatch.setattr(
        StageRepository, 'get_file', AsyncMock(return_value=file)
    )
    return service, session


def pdf_upload():
    return UploadFile(file=io.BytesIO(b'%PDF-1.4 entrega'), filename='a.pdf')


@pytest.mark.parametrize(
    'second_status',
    [StageCollaborationStatus.INVITED, StageCollaborationStatus.ACCEPTED],
    ids=['convidado', 'aceito-no-fluxo-antigo'],
)
@pytest.mark.parametrize('action', ['upload', 'download', 'delete'])
def test_second_slot_has_no_file_access(
    monkeypatch, tmp_path, action, second_status
):
    # Só o responsável trabalha na etapa; a vaga do segundo é só da oferta.
    monkeypatch.setattr(stage_service.settings, 'UPLOAD_DIR', str(tmp_path))
    path = tmp_path / 'entrega.pdf'
    path.write_text('entrega')
    stage = make_stage(
        second_freelancer_id=SECOND_ID, second_status=second_status
    )
    service, _ = file_service(monkeypatch, stage, make_file(path))
    calls = {
        'upload': lambda: service.upload_file(
            STAGE_ID, pdf_upload(), freelancer(SECOND_ID)
        ),
        'download': lambda: service.get_file(
            STAGE_ID, 12, freelancer(SECOND_ID)
        ),
        'delete': lambda: service.delete_file(
            STAGE_ID, 12, freelancer(SECOND_ID)
        ),
    }

    assert expect_error(calls[action]()) == HTTPStatus.FORBIDDEN
    assert path.exists()


def test_responsible_handles_stage_files(monkeypatch, tmp_path, events):
    monkeypatch.setattr(stage_service.settings, 'UPLOAD_DIR', str(tmp_path))
    path = tmp_path / 'entrega.pdf'
    path.write_text('entrega')
    file = make_file(path, uploaded_by_id=MAIN_ID)
    stage = accepted_stage()
    service, session = file_service(monkeypatch, stage, file)

    saved = asyncio.run(
        service.upload_file(STAGE_ID, pdf_upload(), freelancer(MAIN_ID))
    )
    downloaded = asyncio.run(
        service.get_file(STAGE_ID, file.id, freelancer(MAIN_ID))
    )
    asyncio.run(service.delete_file(STAGE_ID, file.id, freelancer(MAIN_ID)))

    assert saved.uploaded_by_id == MAIN_ID
    assert downloaded is file
    session.delete.assert_awaited_once()
    assert not path.exists()


@pytest.mark.parametrize('new_status', [StageStatus.TESTING, StageStatus.DONE])
def test_accepted_second_freelancer_cannot_advance_stage(
    monkeypatch, new_status
):
    service = make_service(monkeypatch, accepted_stage())

    status = expect_error(
        service.update(
            STAGE_ID, StageUpdate(status=new_status), freelancer(SECOND_ID)
        )
    )

    assert status == HTTPStatus.FORBIDDEN


def test_promoted_candidate_uploads_only_after_accepting(monkeypatch, events):
    stage = invited_stage()
    service = make_service(monkeypatch, stage)
    asyncio.run(service.decline(STAGE_ID, freelancer(MAIN_ID)))
    upload_service, _ = file_service(monkeypatch, stage)

    status = expect_error(
        upload_service.upload_file(
            STAGE_ID, pdf_upload(), freelancer(SECOND_ID)
        )
    )

    assert stage.freelancer_id == SECOND_ID
    assert status == HTTPStatus.CONFLICT


def test_freelancer_stage_list_includes_second_freelancer_stages():
    result = SimpleNamespace(
        unique=lambda: SimpleNamespace(
            scalars=lambda: SimpleNamespace(all=lambda: [])
        )
    )
    session = SimpleNamespace(execute=AsyncMock(return_value=result))

    asyncio.run(StageRepository(session).get_all(freelancer_id=SECOND_ID))

    compiled = session.execute.await_args.args[0].compile(
        dialect=postgresql.dialect()
    )
    query = ' '.join(str(compiled).lower().split())
    match = re.search(
        r'where \(?project_stages\.freelancer_id = %\((\w+)\)s '
        r'or project_stages\.second_freelancer_id = %\((\w+)\)s',
        query,
    )
    assert match is not None
    assert compiled.params[match.group(1)] == SECOND_ID
    assert compiled.params[match.group(2)] == SECOND_ID


def test_freelancer_service_lists_only_own_stages(monkeypatch):
    get_all = AsyncMock(return_value=[])
    monkeypatch.setattr(StageRepository, 'get_all', get_all)

    asyncio.run(
        StageService(SimpleNamespace()).get_all(
            freelancer(SECOND_ID), StageSearchFilters()
        )
    )

    assert get_all.await_args.kwargs['freelancer_id'] == SECOND_ID


def test_candidates_exclude_current_main_and_second(monkeypatch):
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
        for employee_id in (MAIN_ID, SECOND_ID, OTHER_ID)
    ]
    service = StageService(
        SimpleNamespace(scalars=AsyncMock(return_value=candidates))
    )
    monkeypatch.setattr(
        service, 'get_by_id', AsyncMock(return_value=accepted_stage())
    )
    monkeypatch.setattr(
        service, '_get_declined_freelancer_ids', AsyncMock(return_value=set())
    )
    monkeypatch.setattr(
        StageRepository, 'get_request_for_stage', AsyncMock(return_value=None)
    )

    available = asyncio.run(
        service.get_available_freelancers(STAGE_ID, MANAGER)
    )

    assert [item.id for item in available] == [OTHER_ID]


# --- remoção do segundo candidato não mexe nos arquivos --------------------


def test_removal_does_not_touch_stage_files(monkeypatch, events):
    stage = stage_with_files(
        status=StageStatus.NO_FREELANCER,
        second_freelancer_id=SECOND_ID,
        second_status=StageCollaborationStatus.INVITED,
    )
    service = make_service(monkeypatch, stage)

    asyncio.run(service.remove_collaborator(STAGE_ID, MANAGER))

    assert [(f.id, f.uploaded_by_id) for f in stage.files] == [
        (1, MAIN_ID),
        (2, SECOND_ID),
    ]
    assert service.calls == ['lock', 'save']
    assert events[0]['payload']['details'] == {'freelancer_id': SECOND_ID}


# --- nome do responsável na resposta da etapa ------------------------------


def stage_for_response(**overrides):
    return make_stage(**overrides)


def test_stage_response_includes_main_freelancer_name():
    stage = stage_for_response()
    stage.freelancer = Employee(
        username='ana',
        email='ana@example.com',
        password_hash='hash',
        role=Roles.FREELANCER,
    )

    response = StageResponse.model_validate(stage)

    assert response.freelancer_id == MAIN_ID
    assert response.freelancer_name == 'ana'


def test_stage_response_without_main_freelancer_has_no_name():
    stage = stage_for_response(
        freelancer_id=None, status=StageStatus.NO_FREELANCER
    )

    response = StageResponse.model_validate(stage)

    assert response.freelancer_id is None
    assert response.freelancer_name is None


def loaded_paths(statement):
    return {
        str(option.path.path[-2])
        for option in statement._with_options  # noqa: SLF001
    }


def test_stage_queries_load_main_and_second_freelancer():
    result = SimpleNamespace(
        unique=lambda: SimpleNamespace(
            scalar_one_or_none=lambda: None,
            scalars=lambda: SimpleNamespace(all=lambda: []),
        )
    )
    session = SimpleNamespace(execute=AsyncMock(return_value=result))
    repository = StageRepository(session)

    asyncio.run(repository.get_by_id(STAGE_ID))
    by_id = loaded_paths(session.execute.await_args.args[0])
    asyncio.run(repository.get_all(freelancer_id=MAIN_ID))
    listing = loaded_paths(session.execute.await_args.args[0])

    for paths in (by_id, listing):
        assert 'ProjectStage.freelancer' in paths
        assert 'ProjectStage.second_freelancer' in paths


def test_update_rereads_freelancer_names(monkeypatch):
    expired = []
    session = SimpleNamespace(
        commit=AsyncMock(),
        expire=lambda instance, attributes: expired.append(attributes),
    )
    stage = make_stage()
    monkeypatch.setattr(
        StageRepository, 'get_by_id', AsyncMock(return_value=stage)
    )

    asyncio.run(StageRepository(session).update(stage))

    session.commit.assert_awaited_once()
    assert expired == [['freelancer', 'second_freelancer']]


# --- trava da etapa nas ações de colaboração --------------------------------


def test_stage_lock_query_locks_only_project_stages():
    result = SimpleNamespace(
        unique=lambda: SimpleNamespace(scalar_one_or_none=lambda: None)
    )
    session = SimpleNamespace(execute=AsyncMock(return_value=result))

    asyncio.run(StageRepository(session).get_by_id_for_update(STAGE_ID))

    statement = session.execute.await_args.args[0]
    query = ' '.join(
        str(statement.compile(dialect=postgresql.dialect())).lower().split()
    )
    assert 'where project_stages.id =' in query
    assert query.endswith('for update of project_stages')
    assert statement.get_execution_options()['populate_existing'] is True
    assert {
        'ProjectStage.freelancer',
        'ProjectStage.second_freelancer',
        'ProjectStage.files',
    } <= loaded_paths(statement)


@pytest.mark.parametrize(
    ('action', 'expected'),
    [
        ('invite', ['lock', 'declined', 'validate', 'save']),
        ('remove', ['lock', 'save']),
        ('accept', ['lock', 'save']),
        ('accept-main', ['lock', 'save']),
        ('decline', ['lock', 'save']),
    ],
)
def test_collaboration_actions_lock_stage_first(
    monkeypatch, events, action, expected
):
    stages = {
        'invite': make_stage,
        'remove': accepted_stage,
        'accept': invited_stage,
        'accept-main': invited_stage,
        'decline': invited_stage,
    }
    service = make_service(monkeypatch, stages[action]())
    calls = {
        'invite': lambda: service.invite_collaborator(
            STAGE_ID, SECOND_ID, MANAGER
        ),
        'remove': lambda: service.remove_collaborator(STAGE_ID, MANAGER),
        'accept': lambda: service.accept_collaboration(
            STAGE_ID, freelancer(SECOND_ID)
        ),
        'accept-main': lambda: service.accept(STAGE_ID, freelancer(MAIN_ID)),
        'decline': lambda: service.decline_collaboration(
            STAGE_ID, freelancer(SECOND_ID)
        ),
    }

    asyncio.run(calls[action]())

    assert service.calls == expected


def test_failed_answer_reads_invite_under_lock(monkeypatch):
    service = make_service(monkeypatch, invited_stage())

    status = expect_error(
        service.accept_collaboration(STAGE_ID, freelancer(OTHER_ID))
    )

    assert status == HTTPStatus.FORBIDDEN
    assert service.calls == ['lock']


# --- convidado não recebe os arquivos ---------------------------------------


def stage_with_files(**overrides):
    stage = make_stage(**overrides)
    for file_id, author in ((1, MAIN_ID), (2, SECOND_ID)):
        file = File(
            file_path=f'/tmp/{file_id}.pdf',
            original_name=f'arquivo-{file_id}.pdf',
            project_stage_id=STAGE_ID,
            uploaded_by_id=author,
        )
        file.id = file_id
        stage.files.append(file)
    return stage


def listed_files(monkeypatch, stage, employee):
    monkeypatch.setattr(
        StageRepository, 'get_all', AsyncMock(return_value=[stage])
    )
    (item,) = asyncio.run(
        StageService(SimpleNamespace()).get_all(employee, StageSearchFilters())
    )
    return StageResponse.model_validate(item).files


@pytest.mark.parametrize(
    'second_status',
    [StageCollaborationStatus.INVITED, StageCollaborationStatus.ACCEPTED],
    ids=['convidado', 'aceito-no-fluxo-antigo'],
)
def test_second_slot_lists_stage_without_files(monkeypatch, second_status):
    stage = stage_with_files(
        second_freelancer_id=SECOND_ID, second_status=second_status
    )

    files = listed_files(monkeypatch, stage, freelancer(SECOND_ID))

    assert files == []
    assert [file.id for file in stage.files] == [1, 2]


@pytest.mark.parametrize(
    'employee',
    [freelancer(MAIN_ID), MANAGER],
    ids=['principal', 'gestor'],
)
def test_responsible_and_manager_list_all_stage_files(monkeypatch, employee):
    stage = stage_with_files(
        second_freelancer_id=SECOND_ID,
        second_status=StageCollaborationStatus.ACCEPTED,
    )

    files = listed_files(monkeypatch, stage, employee)

    assert [file.id for file in files] == [1, 2]


def test_decline_response_has_no_files(monkeypatch, events):
    stage = stage_with_files(
        status=StageStatus.NO_FREELANCER,
        second_freelancer_id=SECOND_ID,
        second_status=StageCollaborationStatus.INVITED,
    )
    service = make_service(monkeypatch, stage)

    response = asyncio.run(
        service.decline_collaboration(STAGE_ID, freelancer(SECOND_ID))
    )

    assert response.files == []
    assert response.second_freelancer_id is None
    assert [file.id for file in stage.files] == [1, 2]
