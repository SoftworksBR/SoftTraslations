# ruff: noqa: PLR2004, PLR6301
import asyncio
import io
from http import HTTPStatus
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import HTTPException, UploadFile

from src.enums.enums import QuoteStatus, RequestStatus, Roles
from src.models.outbox_model import OutboxEvent
from src.services.request_service import RequestService

ATENDENTE = SimpleNamespace(id=5, role=Roles.ATENDIMENTO)


class FakeRequestRepository:
    def __init__(self, request, files_count=0, calls=None):
        self.request = request
        self.calls = calls if calls is not None else []
        self.files_count = files_count
        self.events = []
        self.saved = None
        self.session = SimpleNamespace(add=self._add, flush=self._flush)

    def _add(self, instance):
        if isinstance(instance, OutboxEvent):
            self.events.append(instance)
        elif getattr(instance, 'id', None) is None:
            instance.id = 1

    async def _flush(self):
        return None

    async def get_by_id_for_update(self, request_id):
        self.calls.append('lock_request')
        return self.request

    async def list_files(self, request_id):
        self.calls.append('list_files')
        return [object()] * self.files_count

    async def add_file(self, request_file):
        self.saved = request_file
        return request_file


class FakeQuoteRepository:
    def __init__(self, quote, calls):
        self.quote = quote
        self.calls = calls

    async def get_by_request_id_for_update(self, request_id):
        self.calls.append('lock_quote')
        return self.quote


@pytest.fixture(autouse=True)
def upload_settings(monkeypatch, tmp_path):
    monkeypatch.setenv('UPLOAD_DIR', str(tmp_path))
    monkeypatch.setenv('MAX_FILES_PER_REQUEST', '2')
    monkeypatch.setenv('MAX_UPLOAD_MB', '1')
    return tmp_path


def make_service(
    request_status=RequestStatus.PENDING, quote_status=None, files_count=0
):
    service = RequestService(session=None)
    calls = []
    service.repository = FakeRequestRepository(
        SimpleNamespace(id=1, status=request_status), files_count, calls
    )
    quote = SimpleNamespace(status=quote_status) if quote_status else None
    service.quote_repository = FakeQuoteRepository(quote, calls)
    return service


def upload(name='contrato.pdf', content=b'%PDF-1.4 teste'):
    return UploadFile(file=io.BytesIO(content), filename=name)


def add_file(service, file=None, employee=ATENDENTE):
    return asyncio.run(
        service.add_file_internal(1, file or upload(), employee)
    )


def expect_error(service, file=None, employee=ATENDENTE):
    with pytest.raises(HTTPException) as error:
        add_file(service, file, employee)
    return error.value


def test_atendimento_attaches_file_to_pending_request(upload_settings):
    service = make_service()

    saved = add_file(service)

    assert saved.original_name == 'contrato.pdf'
    assert saved.request_id == 1
    stored = Path(saved.file_path)
    assert stored.parent == upload_settings / 'requests' / '1'
    assert stored.read_bytes() == b'%PDF-1.4 teste'
    (event,) = service.repository.events
    assert event.event_type == 'request.file_added'
    assert event.payload['actor'] == {'employee_id': ATENDENTE.id}
    assert event.payload['source'] == 'api'


def test_atendimento_attaches_file_while_quote_in_review():
    service = make_service(RequestStatus.QUOTED, QuoteStatus.IN_REVIEW)

    assert add_file(service).request_id == 1


@pytest.mark.parametrize(
    ('request_status', 'quote_status'),
    [
        (RequestStatus.QUOTED, QuoteStatus.APPROVED),
        (RequestStatus.REJECTED, QuoteStatus.REJECTED),
    ],
)
def test_closed_quote_blocks_attachment(request_status, quote_status):
    service = make_service(request_status, quote_status)

    error = expect_error(service)

    assert error.status_code == HTTPStatus.CONFLICT
    assert error.detail == 'Não é possível anexar arquivos a esta solicitação.'
    assert service.repository.saved is None


@pytest.mark.parametrize('role', [Roles.FREELANCER, Roles.PROJETOS])
def test_other_roles_cannot_attach_files(role):
    error = expect_error(
        make_service(), employee=SimpleNamespace(id=9, role=role)
    )

    assert error.status_code == HTTPStatus.FORBIDDEN


def test_file_limit_returns_422():
    error = expect_error(make_service(files_count=2))

    assert error.status_code == HTTPStatus.UNPROCESSABLE_ENTITY


def test_invalid_extension_returns_422():
    error = expect_error(make_service(), upload('programa.exe', b'MZ'))

    assert error.status_code == HTTPStatus.UNPROCESSABLE_ENTITY


def test_file_over_size_limit_returns_413():
    big = b'x' * (1024 * 1024 + 1)

    error = expect_error(make_service(), upload('grande.pdf', big))

    assert error.status_code == HTTPStatus.REQUEST_ENTITY_TOO_LARGE


def test_empty_file_returns_422():
    error = expect_error(make_service(), upload('vazio.pdf', b''))

    assert error.status_code == HTTPStatus.UNPROCESSABLE_ENTITY


def test_quote_is_locked_before_request_and_both_before_counting():
    service = make_service(RequestStatus.QUOTED, QuoteStatus.IN_REVIEW)

    add_file(service)

    assert service.repository.calls == [
        'lock_quote',
        'lock_request',
        'list_files',
    ]
