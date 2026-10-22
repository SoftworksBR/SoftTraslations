# ruff: noqa: PLR2004, PLR6301
import asyncio
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.enums.enums import RequestStatus
from src.models.outbox_model import OutboxEvent
from src.schemas.request_schema import RequestCreate, RequestPublicUpdate
from src.services.request_service import RequestService


class FakeRequestRepository:
    def __init__(self, request=None):
        self.request = request
        self.created = None
        self.deleted = None
        self.session = SimpleNamespace(
            add=self._add,
            flush=self._flush,
        )
        self._next_id = 1

    def _add(self, instance):
        if isinstance(instance, OutboxEvent):
            return
        if getattr(instance, 'id', None) is None:
            instance.id = self._next_id
            self._next_id += 1

    async def _flush(self):
        return None

    async def create(self, request):
        self.created = request
        return request

    async def get_by_public_token(self, token):
        return self.request

    async def update(self, request):
        return request

    async def delete(self, request):
        self.deleted = request

    async def list_files(self, request_id):
        return []


class FakeLookup:
    def __init__(self, items):
        self.items = items

    async def get_by_id(self, item_id):
        return self.items.get(item_id)


def make_service(request=None, active_services=(1,), active_languages=(1, 2)):
    service = RequestService(session=None)
    service.repository = FakeRequestRepository(request)
    service.language_repository = FakeLookup({
        i: SimpleNamespace(is_active=True) for i in active_languages
    })
    service.service_repository = FakeLookup({
        i: SimpleNamespace(is_active=True) for i in active_services
    })
    return service


def valid_data(**overrides):
    data = {
        'username': 'Ana',
        'email': 'ana@example.com',
        'phone': '123',
        'source_language_id': 1,
        'target_language_id': 2,
        'service_id': 1,
    }
    data.update(overrides)
    return RequestCreate(**data)


def pending_request(**overrides):
    data = {
        'id': 1,
        'status': RequestStatus.PENDING,
        'service_id': 1,
        'source_language_id': 1,
        'target_language_id': 2,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def run(coro):
    return asyncio.run(coro)


def test_create_generates_unique_public_token_without_employee():
    service = make_service()

    first = run(service.create(valid_data()))
    second = run(service.create(valid_data()))

    assert first.employee_id is None
    assert first.status == RequestStatus.PENDING
    assert len(first.public_token) >= 24
    assert first.public_token != second.public_token


def test_create_rejects_invalid_email():
    with pytest.raises(ValueError, match='email'):
        valid_data(email='nao-e-email')


@pytest.mark.parametrize(
    'overrides',
    [
        {'target_language_id': 1},
        {'service_id': 99},
        {'source_language_id': 99},
    ],
)
def test_create_rejects_invalid_references(overrides):
    service = make_service()

    with pytest.raises(HTTPException) as error:
        run(service.create(valid_data(**overrides)))

    assert error.value.status_code == HTTPStatus.UNPROCESSABLE_ENTITY


def test_client_can_edit_pending_request():
    request = pending_request(observations=None)
    service = make_service(request)

    async def skip_response(_request):
        return None

    service._build_public_response = skip_response

    run(service.update_public('tok', RequestPublicUpdate(observations='x')))

    assert request.observations == 'x'


@pytest.mark.parametrize(
    'status', [RequestStatus.QUOTED, RequestStatus.REJECTED]
)
def test_client_cannot_edit_or_delete_after_analysis(status):
    service = make_service(pending_request(status=status))

    for action in (
        service.update_public('tok', RequestPublicUpdate(observations='x')),
        service.delete_public('tok'),
    ):
        with pytest.raises(HTTPException) as error:
            run(action)

        assert error.value.status_code == HTTPStatus.CONFLICT


def test_unknown_token_returns_not_found():
    service = make_service(request=None)

    with pytest.raises(HTTPException) as error:
        run(service.delete_public('nope'))

    assert error.value.status_code == HTTPStatus.NOT_FOUND


@pytest.mark.parametrize(
    ('raw', 'expected'),
    [
        ('../../etc/passwd', 'passwd'),
        ('meu contrato (1).pdf', 'meu contrato _1_.pdf'),
        (None, 'arquivo'),
    ],
)
def test_clean_filename_strips_paths_and_odd_chars(raw, expected):
    assert RequestService._clean_filename(raw) == expected
