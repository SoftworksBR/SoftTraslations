from datetime import datetime, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal
from email.message import EmailMessage
from email.utils import formataddr
from html import escape
from smtplib import SMTP, SMTP_SSL, SMTPException
from urllib.parse import urlencode

from fastapi import HTTPException, status
from jwt import InvalidTokenError, decode, encode
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import QuoteStatus, RequestStatus, Roles
from src.models.employee_model import Employee
from src.models.quote_model import Quote
from src.repositories.quote_repository import QuoteRepository
from src.repositories.request_repository import RequestRepository
from src.repositories.translation_price_repository import (
    TranslationPriceRepository,
)
from src.schemas.quote_schema import (
    QuoteCreate,
    QuoteSearchFilters,
    QuoteSuggestionResponse,
    QuoteUpdate,
)
from src.services.outbox import enqueue_event
from src.services.quote_pdf import render_quote_pdf
from src.settings import Settings

DECISION_TOKEN_EXPIRE_DAYS = 30


class QuoteService:
    def __init__(
        self,
        session: AsyncSession,
        settings: Settings | None = None,
    ):
        self.repository = QuoteRepository(session)
        self.request_repository = RequestRepository(session)
        self.price_repository = TranslationPriceRepository(session)
        self.settings = settings or Settings()

    async def create(
        self, data: QuoteCreate, current_employee: Employee
    ) -> Quote:
        self._require_atendimento_role(current_employee)

        request = await self.request_repository.get_by_id(data.request_id)
        if request is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Solicitação não encontrada',
            )

        if request.status != RequestStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='A solicitação já possui orçamento ou foi recusada',
            )

        if await self.repository.get_by_request_id(request.id) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Já existe orçamento para esta solicitação',
            )

        quote = Quote(
            request_id=request.id,
            value=data.value,
            deadline=data.deadline,
            observations=data.observations,
            created_by_id=current_employee.id,
        )
        request.status = RequestStatus.QUOTED
        request.employee_id = current_employee.id
        self.repository.session.add(quote)
        await self.repository.session.flush()
        enqueue_event(
            self.repository.session,
            event_type='quote.created',
            aggregate_type='quote',
            aggregate_id=quote.id,
            payload={
                'actor': {'employee_id': current_employee.id},
                'details': {'status': quote.status.value},
                'source': 'api',
                'request_id': request.id,
            },
        )
        enqueue_event(
            self.repository.session,
            event_type='request.quoted',
            aggregate_type='request',
            aggregate_id=request.id,
            payload={
                'actor': {'employee_id': current_employee.id},
                'details': {'status': request.status.value},
                'source': 'api',
                'request_id': request.id,
            },
        )
        quote = await self.repository.create(quote)

        try:
            self._send_quote_email(quote)
        except (OSError, SMTPException) as error:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail='Orçamento criado, mas o envio do e-mail falhou',
            ) from error

        return quote

    async def suggest(
        self,
        request_id: int,
        word_count: int | None,
        current_employee: Employee,
    ) -> QuoteSuggestionResponse:
        self._require_atendimento_role(current_employee)

        request = await self.request_repository.get_by_id(request_id)
        if request is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Solicitação não encontrada',
            )

        words = word_count if word_count is not None else request.word_count
        prices = []
        if request.service_id is not None:
            for language in request.target_languages:
                price = await self.price_repository.get_by_combination(
                    request.service_id,
                    request.source_language_id,
                    language.id,
                )
                if price is None or not price.is_active:
                    prices = []
                    break
                prices.append(price)

        price_per_word = (
            sum(
                (price.price_per_word for price in prices),
                Decimal('0'),
            )
            if prices
            else None
        )
        suggested = None
        if price_per_word is not None and words:
            suggested = (price_per_word * words).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )

        return QuoteSuggestionResponse(
            request_id=request.id,
            word_count=words,
            price_per_word=(
                float(price_per_word)
                if price_per_word is not None
                else None
            ),
            suggested_value=(
                float(suggested) if suggested is not None else None
            ),
        )

    async def get_by_id(
        self, quote_id: int, current_employee: Employee
    ) -> Quote:
        self._require_read_role(current_employee)

        return await self._get(quote_id)

    async def get_all(
        self,
        current_employee: Employee,
        filters: QuoteSearchFilters,
    ) -> list[Quote]:
        self._require_read_role(current_employee)

        return await self.repository.get_all(filters)

    async def update(
        self,
        quote_id: int,
        data: QuoteUpdate,
        current_employee: Employee,
    ) -> Quote:
        self._require_atendimento_role(current_employee)
        quote = await self._get(quote_id)
        self._require_in_review(quote)

        if data.value is not None:
            quote.value = data.value

        if data.deadline is not None:
            quote.deadline = data.deadline

        if 'observations' in data.model_fields_set:
            quote.observations = data.observations

        enqueue_event(
            self.repository.session,
            event_type='quote.updated',
            aggregate_type='quote',
            aggregate_id=quote.id,
            payload={
                'actor': {'employee_id': current_employee.id},
                'details': {'status': quote.status.value},
                'source': 'api',
                'request_id': quote.request_id,
            },
        )
        return await self.repository.update(quote)

    async def approve(
        self, quote_id: int, current_employee: Employee
    ) -> Quote:
        self._require_atendimento_role(current_employee)
        quote = await self._get_for_update(quote_id)
        self._require_in_review(quote)

        quote.status = QuoteStatus.APPROVED
        quote.approved_by_id = current_employee.id
        quote.approved_at = datetime.now(timezone.utc).replace(tzinfo=None)

        enqueue_event(
            self.repository.session,
            event_type='quote.approved',
            aggregate_type='quote',
            aggregate_id=quote.id,
            payload={
                'actor': {'employee_id': current_employee.id},
                'details': {'status': quote.status.value},
                'source': 'api',
                'request_id': quote.request_id,
            },
        )
        return await self.repository.update(quote)

    async def reject(self, quote_id: int, current_employee: Employee) -> Quote:
        self._require_atendimento_role(current_employee)
        quote = await self._get_for_update(quote_id)
        self._require_in_review(quote)

        quote.status = QuoteStatus.REJECTED
        quote.approved_by_id = current_employee.id
        quote.approved_at = datetime.now(timezone.utc).replace(tzinfo=None)
        request = await self.request_repository.get_by_id(quote.request_id)
        if request is not None:
            request.status = RequestStatus.REJECTED
            enqueue_event(
                self.repository.session,
                event_type='request.rejected',
                aggregate_type='request',
                aggregate_id=request.id,
                payload={
                    'actor': {'employee_id': current_employee.id},
                    'details': {'status': request.status.value},
                    'source': 'api',
                    'request_id': request.id,
                },
            )
        enqueue_event(
            self.repository.session,
            event_type='quote.rejected',
            aggregate_type='quote',
            aggregate_id=quote.id,
            payload={
                'actor': {'employee_id': current_employee.id},
                'details': {'status': quote.status.value},
                'source': 'api',
                'request_id': quote.request_id,
            },
        )
        quote = await self.repository.update(quote)

        return quote

    async def decide_by_client(
        self, quote_id: int, decision: str
    ) -> Quote:
        if decision not in {'approve', 'reject'}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Decisão inválida',
            )

        quote = await self.repository.get_by_id_for_update(quote_id)
        if quote is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Orçamento não encontrado',
            )
        self._require_in_review(quote)

        quote.status = (
            QuoteStatus.APPROVED
            if decision == 'approve'
            else QuoteStatus.REJECTED
        )
        quote.approved_by_id = None
        quote.approved_at = datetime.now(timezone.utc).replace(tzinfo=None)

        if decision == 'reject':
            request = await self.request_repository.get_by_id(
                quote.request_id
            )
            if request is not None:
                request.status = RequestStatus.REJECTED
                enqueue_event(
                    self.repository.session,
                    event_type='request.rejected',
                    aggregate_type='request',
                    aggregate_id=request.id,
                    payload={
                        'actor': {'type': 'client'},
                        'details': {'status': request.status.value},
                        'source': 'client_email',
                        'request_id': request.id,
                    },
                )

        enqueue_event(
            self.repository.session,
            event_type=(
                'quote.approved' if decision == 'approve' else 'quote.rejected'
            ),
            aggregate_type='quote',
            aggregate_id=quote.id,
            payload={
                'actor': {'type': 'client'},
                'details': {'status': quote.status.value},
                'source': 'client_email',
                'request_id': quote.request_id,
            },
        )
        return await self.repository.update(quote)

    @staticmethod
    def verify_decision_token(
        token: str, quote_id: int, decision: str, settings: Settings
    ) -> None:
        try:
            payload = decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )
        except InvalidTokenError as error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Link de decisão inválido ou expirado',
            ) from error

        if (
            payload.get('purpose') != 'quote_decision'
            or payload.get('quote_id') != quote_id
            or payload.get('decision') != decision
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Link de decisão inválido ou expirado',
            )

    def _create_decision_link(self, quote: Quote, decision: str) -> str:
        token = encode(
            {
                'purpose': 'quote_decision',
                'quote_id': quote.id,
                'decision': decision,
                'exp': datetime.now(timezone.utc)
                + timedelta(days=DECISION_TOKEN_EXPIRE_DAYS),
            },
            self.settings.SECRET_KEY,
            algorithm=self.settings.ALGORITHM,
        )
        query = urlencode({'token': token, 'decision': decision})
        return (
            f'{self.settings.PUBLIC_API_URL.rstrip("/")}'
            f'/public/quotes/{quote.id}/decision?{query}'
        )

    async def send_email(
        self,
        quote_id: int,
        current_employee: Employee,
    ) -> dict[str, str]:
        self._require_atendimento_role(current_employee)

        quote = await self._get_for_update(quote_id)
        self._require_in_review(quote)

        try:
            self._send_quote_email(quote)
        except (OSError, SMTPException) as error:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail='Orçamento criado, mas o envio do e-mail falhou',
            ) from error

        return {
            'message': 'Orçamento enviado com sucesso.',
            'recipient': quote.client_email,
        }

    def _send_quote_email(self, quote: Quote) -> None:
        if not self.settings.SMTP_HOST or not self.settings.SMTP_FROM_EMAIL:
            raise SMTPException('SMTP email settings are not configured')

        quote_number = f'ORC-{quote.created_at:%Y%m%d}-{quote.id:06d}'

        pdf = render_quote_pdf(quote)

        message = EmailMessage()
        message['Subject'] = f'Orçamento SoftTranslations - {quote_number}'
        message['From'] = formataddr((
            self.settings.SMTP_FROM_NAME,
            self.settings.SMTP_FROM_EMAIL,
        ))
        message['To'] = quote.client_email

        approve_url = self._create_decision_link(quote, 'approve')
        reject_url = self._create_decision_link(quote, 'reject')
        message.set_content(
            f'Olá, {quote.client_name}.\n\n'
            'Estamos encaminhando em anexo o orçamento solicitado.\n\n'
            f'Número do orçamento: {quote_number}\n'
            f'Valor: R$ {quote.value:.2f}\n'
            f'Prazo: {quote.deadline:%d/%m/%Y}\n\n'
            'Para decidir, acesse um dos links abaixo:\n'
            f'Aprovar: {approve_url}\n'
            f'Recusar: {reject_url}\n\n'
            'Atenciosamente,\n'
            'Equipe SoftTranslations'
        )
        message.add_alternative(
            f'<p>Olá, {escape(quote.client_name)}.</p>'
            '<p>Estamos encaminhando em anexo o orçamento solicitado.</p>'
            f'<p><strong>Número:</strong> {quote_number}<br>'
            f'<strong>Valor:</strong> R$ {quote.value:.2f}<br>'
            f'<strong>Prazo:</strong> {quote.deadline:%d/%m/%Y}</p>'
            '<p>Escolha uma opção para registrar sua decisão:</p>'
            '<p>'
            f'<a href="{escape(approve_url, quote=True)}" '
            'style="background:#087f8c;color:white;padding:12px 20px;'
            'text-decoration:none;border-radius:6px">Aprovar orçamento</a>'
            '&nbsp;'
            f'<a href="{escape(reject_url, quote=True)}" '
            'style="background:#b42318;color:white;padding:12px 20px;'
            'text-decoration:none;border-radius:6px">Recusar orçamento</a>'
            '</p>'
            '<p>Atenciosamente,<br>Equipe SoftTranslations</p>',
            subtype='html',
        )

        message.add_attachment(
            pdf,
            maintype='application',
            subtype='pdf',
            filename=f'{quote_number}.pdf',
        )

        smtp_type = SMTP_SSL if self.settings.SMTP_USE_SSL else SMTP

        with smtp_type(
            self.settings.SMTP_HOST,
            self.settings.SMTP_PORT,
            timeout=self.settings.SMTP_TIMEOUT_SECONDS,
        ) as smtp:
            if not self.settings.SMTP_USE_SSL and self.settings.SMTP_USE_TLS:
                smtp.starttls()

            if self.settings.SMTP_USERNAME:
                smtp.login(
                    self.settings.SMTP_USERNAME,
                    self.settings.SMTP_PASSWORD,
                )

            smtp.send_message(message)

    async def delete(self, quote_id: int, current_employee: Employee) -> None:
        self._require_atendimento_role(current_employee)
        quote = await self._get(quote_id)
        self._require_in_review(quote)

        request = await self.request_repository.get_by_id(quote.request_id)
        if request is not None:
            request.status = RequestStatus.PENDING
            enqueue_event(
                self.repository.session,
                event_type='request.reopened',
                aggregate_type='request',
                aggregate_id=request.id,
                payload={
                    'actor': {'employee_id': current_employee.id},
                    'details': {'status': request.status.value},
                    'source': 'api',
                    'request_id': request.id,
                },
            )
        enqueue_event(
            self.repository.session,
            event_type='quote.deleted',
            aggregate_type='quote',
            aggregate_id=quote.id,
            payload={
                'actor': {'employee_id': current_employee.id},
                'details': {},
                'source': 'api',
                'request_id': quote.request_id,
            },
        )
        await self.repository.delete(quote)

    async def _get(self, quote_id: int) -> Quote:
        quote = await self.repository.get_by_id(quote_id)

        if quote is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Orçamento não encontrado',
            )

        return quote

    async def _get_for_update(self, quote_id: int) -> Quote:
        quote = await self.repository.get_by_id_for_update(quote_id)

        if quote is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Orçamento não encontrado',
            )

        return quote

    @staticmethod
    def _require_in_review(quote: Quote) -> None:
        if quote.status != QuoteStatus.IN_REVIEW:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='O orçamento já foi decidido e não pode ser alterado',
            )

    @staticmethod
    def _require_read_role(current_employee: Employee) -> None:
        if current_employee.role not in {
            Roles.ATENDIMENTO,
            Roles.PROJETOS,
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only atendimento and projetos can read quotes',
            )

    @staticmethod
    def _require_atendimento_role(current_employee: Employee) -> None:
        if current_employee.role != Roles.ATENDIMENTO:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only atendimento can use this endpoint',
            )
