import asyncio
from datetime import UTC, date, datetime
from decimal import Decimal
from http import HTTPStatus
from smtplib import SMTPException
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.enums.enums import QuoteStatus, Roles
from src.services.client_invoice_pdf import render_client_invoice_pdf
from src.services.client_invoice_service import ClientInvoiceService

ATENDENTE = SimpleNamespace(id=7, role=Roles.ATENDIMENTO)
GESTOR = SimpleNamespace(id=9, role=Roles.PROJETOS)

EXPECTED_INVOICE_ID = 15
EXPECTED_COMMIT_COUNT = 2


class FakeSession:
    def __init__(self):
        self.invoice = None
        self.commit_count = 0

    def add(self, instance):
        self.invoice = instance

    async def flush(self):
        self.invoice.id = 15
        self.invoice.created_at = datetime.now(UTC)

    async def commit(self):
        self.commit_count += 1

    async def rollback(self):
        self.invoice = None


class FakeQuoteRepository:
    def __init__(self, quote):
        self.quote = quote

    async def get_by_id(self, quote_id):
        return self.quote


class FakeInvoiceRepository:
    def __init__(self, existing_invoice=None):
        self.existing_invoice = existing_invoice

    async def get_by_quote_id(self, quote_id):
        return self.existing_invoice


def run(coro):
    return asyncio.run(coro)


def make_quote(status=QuoteStatus.APPROVED):
    return SimpleNamespace(
        id=3,
        created_by_id=ATENDENTE.id,
        status=status,
        value=Decimal('150.00'),
        client_name='Cliente Teste',
        client_email='cliente@email.com',
        service_name='Tradução técnica',
        source_language_name='Português',
        target_language_name='Inglês',
    )


def make_service(quote=None, existing_invoice=None):
    session = FakeSession()

    service = ClientInvoiceService(
        session=session,
        settings=SimpleNamespace(),
    )

    service.quote_repository = FakeQuoteRepository(quote)
    service.repository = FakeInvoiceRepository(existing_invoice)

    return service, session


def test_only_atendimento_can_issue_client_invoice():
    service, _ = make_service(make_quote())

    with pytest.raises(HTTPException) as error:
        run(service.create_and_email(3, GESTOR))

    assert error.value.status_code == HTTPStatus.FORBIDDEN


def test_invoice_requires_existing_quote():
    service, _ = make_service(quote=None)

    with pytest.raises(HTTPException) as error:
        run(service.create_and_email(3, ATENDENTE))

    assert error.value.status_code == HTTPStatus.NOT_FOUND


@pytest.mark.parametrize(
    'status',
    [QuoteStatus.IN_REVIEW, QuoteStatus.REJECTED],
)
def test_invoice_requires_approved_quote(status):
    service, _ = make_service(make_quote(status=status))

    with pytest.raises(HTTPException) as error:
        run(service.create_and_email(3, ATENDENTE))

    assert error.value.status_code == HTTPStatus.CONFLICT


def test_invoice_rejects_duplicate():
    existing_invoice = SimpleNamespace(id=10)
    service, session = make_service(
        make_quote(),
        existing_invoice=existing_invoice,
    )

    with pytest.raises(HTTPException) as error:
        run(service.create_and_email(3, ATENDENTE))

    assert error.value.status_code == HTTPStatus.CONFLICT
    assert session.invoice is None


def test_invoice_is_created_and_email_is_sent(monkeypatch):
    service, session = make_service(make_quote())
    sent_invoices = []

    def fake_send_email(invoice):
        sent_invoices.append(invoice)

    monkeypatch.setattr(service, '_send_email', fake_send_email)

    result = run(service.create_and_email(3, ATENDENTE))

    assert result.invoice.id == EXPECTED_INVOICE_ID
    assert result.invoice.invoice_number == (
        f'FAT-{date.today():%Y%m%d}-000015'
    )
    assert result.invoice.client_name == 'Cliente Teste'
    assert result.invoice.client_email == 'cliente@email.com'
    assert result.invoice.amount == Decimal('150.00')
    assert result.invoice.description == (
        'Tradução técnica - Português para Inglês'
    )
    assert result.recipient == 'cliente@email.com'
    assert result.invoice.emailed_at is not None
    assert len(sent_invoices) == 1
    assert session.commit_count == EXPECTED_COMMIT_COUNT


def test_approval_invoice_uses_quote_creator_and_sends(monkeypatch):
    service, _ = make_service(make_quote())
    sent_invoices = []

    def fake_send_email(invoice):
        sent_invoices.append(invoice)

    monkeypatch.setattr(service, '_send_email', fake_send_email)

    result = run(service.create_and_email_for_approval(3))

    assert result.invoice.created_by_id == ATENDENTE.id
    assert result.invoice.emailed_at is not None
    assert len(sent_invoices) == 1


def test_smtp_failure_keeps_invoice_without_email_confirmation(
    monkeypatch,
):
    service, session = make_service(make_quote())

    def fake_send_email(invoice):
        raise SMTPException('SMTP indisponível')

    monkeypatch.setattr(service, '_send_email', fake_send_email)

    with pytest.raises(HTTPException) as error:
        run(service.create_and_email(3, ATENDENTE))

    assert error.value.status_code == HTTPStatus.BAD_GATEWAY
    assert session.invoice is not None
    assert session.invoice.emailed_at is None
    assert session.commit_count == 1


def test_invoice_pdf_is_generated():

    service, session = make_service(make_quote())
    service._send_email = lambda invoice: None

    result = run(service.create_and_email(3, ATENDENTE))
    pdf = render_client_invoice_pdf(result.invoice)

    assert pdf.startswith(b'%PDF-1.4')
    assert b'%%EOF' in pdf
