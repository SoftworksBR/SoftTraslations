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
from src.models.stage_model import ProjectStage
from src.repositories.stage_repository import StageRepository
from src.schemas.stage_schema import StageSearchFilters, StageUpdate
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


def make_service(monkeypatch, stage, declined=(), files=()):
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

    # Simula o UPDATE de autoria sobre os arquivos da etapa.
    service.files = list(files)
    service.reassign_calls = []

    async def reassign_stage_files(self, stage_id, from_id, to_id):
        service.reassign_calls.append((stage_id, from_id, to_id))
        moved = [f for f in service.files if f.uploaded_by_id == from_id]
        for file in moved:
            file.uploaded_by_id = to_id
        return len(moved)

    monkeypatch.setattr(StageRepository, 'update', update)
    monkeypatch.setattr(
        StageRepository, 'reassign_stage_files', reassign_stage_files
    )
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
    assert event['payload']['details'] == {
        'freelancer_id': SECOND_ID,
        'files_reassigned': 0,
    }


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


def test_accepted_second_freelancer_uploads_file(
    monkeypatch, tmp_path, events
):
    monkeypatch.setattr(stage_service.settings, 'UPLOAD_DIR', str(tmp_path))
    service, _ = file_service(monkeypatch, accepted_stage())

    saved = asyncio.run(
        service.upload_file(STAGE_ID, pdf_upload(), freelancer(SECOND_ID))
    )

    assert saved.uploaded_by_id == SECOND_ID
    assert saved.project_stage_id == STAGE_ID
    assert events[0]['event_type'] == 'project_stage.file_added'


def test_accepted_second_freelancer_downloads_file(monkeypatch, tmp_path):
    path = tmp_path / 'entrega.pdf'
    path.write_text('entrega')
    file = make_file(path, uploaded_by_id=MAIN_ID)
    service, _ = file_service(monkeypatch, accepted_stage(), file)

    result = asyncio.run(
        service.get_file(STAGE_ID, file.id, freelancer(SECOND_ID))
    )

    assert result is file


def test_accepted_second_freelancer_removes_own_file(
    monkeypatch, tmp_path, events
):
    path = tmp_path / 'entrega.pdf'
    path.write_text('entrega')
    stage = accepted_stage(status=StageStatus.TESTING)
    service, session = file_service(monkeypatch, stage, make_file(path))

    asyncio.run(service.delete_file(STAGE_ID, 12, freelancer(SECOND_ID)))

    session.delete.assert_awaited_once()
    assert not path.exists()
    assert stage.status == StageStatus.IN_PROGRESS


def test_second_freelancer_cannot_remove_others_file(monkeypatch, tmp_path):
    path = tmp_path / 'entrega.pdf'
    path.write_text('entrega')
    file = make_file(path, uploaded_by_id=MAIN_ID)
    service, _ = file_service(monkeypatch, accepted_stage(), file)

    status = expect_error(
        service.delete_file(STAGE_ID, file.id, freelancer(SECOND_ID))
    )

    assert status == HTTPStatus.FORBIDDEN


@pytest.mark.parametrize('action', ['upload', 'download', 'delete'])
def test_invited_second_freelancer_has_no_file_access(
    monkeypatch, tmp_path, action
):
    path = tmp_path / 'entrega.pdf'
    path.write_text('entrega')
    stage = make_stage(
        second_freelancer_id=SECOND_ID,
        second_status=StageCollaborationStatus.INVITED,
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


def test_second_cannot_upload_after_main_freelancer_declines(
    monkeypatch, events
):
    stage = accepted_stage()
    service = make_service(monkeypatch, stage)
    stage.status = StageStatus.NO_FREELANCER
    asyncio.run(service.decline(STAGE_ID, freelancer(MAIN_ID)))
    upload_service, _ = file_service(monkeypatch, stage)

    status = expect_error(
        upload_service.upload_file(
            STAGE_ID, pdf_upload(), freelancer(SECOND_ID)
        )
    )

    assert stage.freelancer_id is None
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


# --- arquivos do tradutor adicional removido ------------------------------


def stage_file(file_id, uploaded_by_id, path=None):
    return SimpleNamespace(
        id=file_id,
        file_path=str(path) if path else f'/tmp/{file_id}.pdf',
        original_name=f'arquivo-{file_id}.pdf',
        uploaded_by_id=uploaded_by_id,
    )


def test_removal_reassigns_collaborator_files_to_main(monkeypatch, events):
    files = [
        stage_file(1, SECOND_ID),
        stage_file(2, SECOND_ID),
        stage_file(3, MAIN_ID),
        stage_file(4, MANAGER.id),
    ]
    service = make_service(monkeypatch, accepted_stage(), files=files)

    asyncio.run(service.remove_collaborator(STAGE_ID, MANAGER))

    assert [f.uploaded_by_id for f in files] == [
        MAIN_ID,
        MAIN_ID,
        MAIN_ID,
        MANAGER.id,
    ]
    assert service.reassign_calls == [(STAGE_ID, SECOND_ID, MAIN_ID)]
    assert events[0]['payload']['details'] == {
        'freelancer_id': SECOND_ID,
        'files_reassigned': 2,
    }


def test_main_freelancer_deletes_reassigned_file(
    monkeypatch, tmp_path, events
):
    path = tmp_path / 'do-colaborador.pdf'
    path.write_text('entrega')
    file = stage_file(1, SECOND_ID, path)
    asyncio.run(
        make_service(
            monkeypatch, accepted_stage(), files=[file]
        ).remove_collaborator(STAGE_ID, MANAGER)
    )
    stage = make_stage()
    service, session = file_service(monkeypatch, stage, file)

    asyncio.run(service.delete_file(STAGE_ID, file.id, freelancer(MAIN_ID)))

    session.delete.assert_awaited_once()
    assert not path.exists()


def test_removal_without_collaborator_files_reports_zero(monkeypatch, events):
    files = [stage_file(3, MAIN_ID)]
    service = make_service(monkeypatch, accepted_stage(), files=files)

    asyncio.run(service.remove_collaborator(STAGE_ID, MANAGER))

    assert files[0].uploaded_by_id == MAIN_ID
    assert events[0]['payload']['details']['files_reassigned'] == 0


def test_removal_without_main_freelancer_keeps_files(monkeypatch, events):
    files = [stage_file(1, SECOND_ID)]
    stage = accepted_stage(
        freelancer_id=None, status=StageStatus.NO_FREELANCER
    )
    service = make_service(monkeypatch, stage, files=files)

    result = asyncio.run(service.remove_collaborator(STAGE_ID, MANAGER))

    assert result.second_freelancer_id is None
    assert files[0].uploaded_by_id == SECOND_ID
    assert service.reassign_calls == []
    assert events[0]['payload']['details']['files_reassigned'] == 0


def test_reassign_query_moves_only_removed_freelancer_stage_files():
    session = SimpleNamespace(
        execute=AsyncMock(return_value=SimpleNamespace(rowcount=2))
    )

    moved = asyncio.run(
        StageRepository(session).reassign_stage_files(
            STAGE_ID, SECOND_ID, MAIN_ID
        )
    )

    compiled = session.execute.await_args.args[0].compile(
        dialect=postgresql.dialect()
    )
    query = ' '.join(str(compiled).lower().split())
    assert moved == 2  # noqa: PLR2004
    assert query.startswith('update files set uploaded_by_id=')
    assert 'files.project_stage_id = %(project_stage_id_1)s' in query
    assert 'files.uploaded_by_id = %(uploaded_by_id_1)s' in query
    assert compiled.params == {
        'uploaded_by_id': MAIN_ID,
        'project_stage_id_1': STAGE_ID,
        'uploaded_by_id_1': SECOND_ID,
    }
