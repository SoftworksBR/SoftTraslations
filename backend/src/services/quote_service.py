from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal

from fastapi import HTTPException, status
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


class QuoteService:
    def __init__(self, session: AsyncSession):
        self.repository = QuoteRepository(session)
        self.request_repository = RequestRepository(session)
        self.price_repository = TranslationPriceRepository(session)

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
        price = (
            await self.price_repository.get_by_combination(
                request.service_id,
                request.source_language_id,
                request.target_language_id,
            )
            if request.service_id is not None
            else None
        )
        if price is not None and not price.is_active:
            price = None

        suggested = None
        if price is not None and words:
            suggested = (price.price_per_word * words).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )

        return QuoteSuggestionResponse(
            request_id=request.id,
            word_count=words,
            price_per_word=(
                float(price.price_per_word) if price is not None else None
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
        quote = await self._get(quote_id)
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
        quote = await self._get(quote_id)
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
