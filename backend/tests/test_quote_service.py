# ruff: noqa: PLR2004, PLR6301
import asyncio
from datetime import date
from decimal import Decimal
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.enums.enums import QuoteStatus, RequestStatus, Roles, Status
from src.models.path_model import Path
from src.schemas.project_schema import ProjectCreate
from src.schemas.quote_schema import QuoteCreate, QuoteUpdate
from src.services.project_service import ProjectService
from src.services.quote_service import QuoteService

ATENDENTE = SimpleNamespace(id=7, role=Roles.ATENDIMENTO)
GESTOR = SimpleNamespace(id=9, role=Roles.PROJETOS)


class FakeQuoteRepository:
    def __init__(self, quote=None):
        self.quote = quote
        self.created = None
        self.deleted = None

    async def get_by_request_id(self, request_id):
        return self.quote

    async def get_by_id(self, quote_id):
        return self.quote

    async def create(self, quote):
        self.created = quote
        return quote

    async def update(self, quote):
        return quote

    async def delete(self, quote):
        self.deleted = quote


class FakeRequestRepository:
    def __init__(self, request):
        self.request = request

    async def get_by_id(self, request_id):
        return self.request

    async def update(self, request):
        return request


def make_service(quote=None, request=None, price=None):
    service = QuoteService(session=None)
    service.repository = FakeQuoteRepository(quote)
    service.request_repository = FakeRequestRepository(request)

    class FakePrices:
        @staticmethod
        async def get_by_combination(*args):
            return price

    service.price_repository = FakePrices()
    return service


def make_request(**overrides):
    data = {
        'id': 1,
        'status': RequestStatus.PENDING,
        'employee_id': None,
        'service_id': 1,
        'source_language_id': 1,
        'target_language_id': 2,
        'word_count': 1000,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def make_quote(status=QuoteStatus.IN_REVIEW, **overrides):
    data = {
        'id': 3,
        'request_id': 1,
        'value': Decimal('100.00'),
        'deadline': date(2026, 12, 1),
        'observations': None,
        'status': status,
        'approved_by_id': None,
        'approved_at': None,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def run(coro):
    return asyncio.run(coro)


def test_quote_create_requires_atendimento_role():
    service = make_service(request=make_request())
    data = QuoteCreate(
        request_id=1, value=Decimal('10'), deadline=date(2026, 12, 1)
    )

    with pytest.raises(HTTPException) as error:
        run(service.create(data, GESTOR))

    assert error.value.status_code == HTTPStatus.FORBIDDEN


def test_quote_create_marks_request_as_quoted_and_assigns_employee():
    request = make_request()
    service = make_service(request=request)
    data = QuoteCreate(
        request_id=1, value=Decimal('10'), deadline=date(2026, 12, 1)
    )

    quote = run(service.create(data, ATENDENTE))

    assert quote.created_by_id == ATENDENTE.id
    assert request.status == RequestStatus.QUOTED
    assert request.employee_id == ATENDENTE.id


def test_quote_create_rejects_request_that_is_not_pending():
    service = make_service(request=make_request(status=RequestStatus.QUOTED))
    data = QuoteCreate(
        request_id=1, value=Decimal('10'), deadline=date(2026, 12, 1)
    )

    with pytest.raises(HTTPException) as error:
        run(service.create(data, ATENDENTE))

    assert error.value.status_code == HTTPStatus.CONFLICT


def test_quote_create_rejects_duplicate_quote_for_request():
    service = make_service(request=make_request(), quote=make_quote())
    data = QuoteCreate(
        request_id=1, value=Decimal('10'), deadline=date(2026, 12, 1)
    )

    with pytest.raises(HTTPException) as error:
        run(service.create(data, ATENDENTE))

    assert error.value.status_code == HTTPStatus.CONFLICT


def test_quote_value_must_be_positive():
    with pytest.raises(ValueError, match='greater than 0'):
        QuoteCreate(
            request_id=1, value=Decimal('0'), deadline=date(2026, 12, 1)
        )


def test_approve_sets_approver_and_date():
    quote = make_quote()
    service = make_service(quote=quote)

    result = run(service.approve(3, ATENDENTE))

    assert result.status == QuoteStatus.APPROVED
    assert result.approved_by_id == ATENDENTE.id
    assert result.approved_at is not None


def test_reject_marks_request_as_rejected():
    request = make_request(status=RequestStatus.QUOTED)
    service = make_service(quote=make_quote(), request=request)

    result = run(service.reject(3, ATENDENTE))

    assert result.status == QuoteStatus.REJECTED
    assert request.status == RequestStatus.REJECTED


@pytest.mark.parametrize(
    'status', [QuoteStatus.APPROVED, QuoteStatus.REJECTED]
)
def test_decided_quote_cannot_change(status):
    service = make_service(quote=make_quote(status=status))

    for action in (
        service.approve(3, ATENDENTE),
        service.reject(3, ATENDENTE),
        service.update(3, QuoteUpdate(value=Decimal('1')), ATENDENTE),
        service.delete(3, ATENDENTE),
    ):
        with pytest.raises(HTTPException) as error:
            run(action)

        assert error.value.status_code == HTTPStatus.CONFLICT


def test_delete_returns_request_to_pending():
    request = make_request(status=RequestStatus.QUOTED)
    quote = make_quote()
    service = make_service(quote=quote, request=request)

    run(service.delete(3, ATENDENTE))

    assert service.repository.deleted is quote
    assert request.status == RequestStatus.PENDING


def test_only_atendimento_and_projetos_can_read_quotes():
    service = make_service(quote=make_quote())

    assert run(service.get_by_id(3, GESTOR)).id == 3
    assert run(service.get_by_id(3, ATENDENTE)).id == 3

    with pytest.raises(HTTPException) as error:
        run(service.get_by_id(3, SimpleNamespace(role=Roles.FREELANCER)))

    assert error.value.status_code == HTTPStatus.FORBIDDEN


def test_suggestion_multiplies_price_per_word_by_word_count():
    price = SimpleNamespace(price_per_word=Decimal('0.5000'), is_active=True)
    service = make_service(request=make_request(), price=price)

    result = run(service.suggest(1, None, ATENDENTE))
    override = run(service.suggest(1, 333, ATENDENTE))

    assert result.suggested_value == 500.0
    assert override.suggested_value == 166.5


def test_suggestion_is_empty_without_price_or_words():
    no_price = make_service(request=make_request(), price=None)
    no_words = make_service(
        request=make_request(word_count=None),
        price=SimpleNamespace(price_per_word=Decimal('1'), is_active=True),
    )

    assert run(no_price.suggest(1, None, ATENDENTE)).suggested_value is None
    assert run(no_words.suggest(1, None, ATENDENTE)).suggested_value is None


# ---- projeto criado a partir do orçamento ---------------------------------


class FakeSession:
    def __init__(self, existing_project_id=None):
        self.existing_project_id = existing_project_id

    async def scalars(self, statement):
        return SimpleNamespace(all=lambda: [Path(name='trilha')])

    async def scalar(self, statement):
        return self.existing_project_id


def make_project_service(quote, existing_project_id=None):
    service = ProjectService(session=None)
    service.quote_repository = FakeQuoteRepository(quote)

    class FakeProjectRepository:
        session = FakeSession(existing_project_id)

        async def create(self, project):
            return project

    service.repository = FakeProjectRepository()
    return service


def test_project_uses_logged_employee_as_creator():
    service = make_project_service(make_quote(status=QuoteStatus.APPROVED))
    data = ProjectCreate(name='P', quote_id=3, creator_id=999, path_ids=[1])

    project = run(service.create(data, GESTOR))

    assert project.creator_id == GESTOR.id
    assert project.quote_id == 3
    assert project.status == Status.READY


@pytest.mark.parametrize(
    'status', [QuoteStatus.IN_REVIEW, QuoteStatus.REJECTED]
)
def test_project_requires_approved_quote(status):
    service = make_project_service(make_quote(status=status))
    data = ProjectCreate(name='P', quote_id=3, path_ids=[1])

    with pytest.raises(HTTPException) as error:
        run(service.create(data, GESTOR))

    assert error.value.status_code == HTTPStatus.CONFLICT


def test_project_rejects_quote_that_already_has_project():
    service = make_project_service(
        make_quote(status=QuoteStatus.APPROVED), existing_project_id=5
    )
    data = ProjectCreate(name='P', quote_id=3, path_ids=[1])

    with pytest.raises(HTTPException) as error:
        run(service.create(data, GESTOR))

    assert error.value.status_code == HTTPStatus.CONFLICT


def test_project_rejects_unknown_quote():
    service = make_project_service(None)
    data = ProjectCreate(name='P', quote_id=3, path_ids=[1])

    with pytest.raises(HTTPException) as error:
        run(service.create(data, GESTOR))

    assert error.value.status_code == HTTPStatus.NOT_FOUND
