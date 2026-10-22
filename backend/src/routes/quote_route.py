from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.quote_controller import QuoteController
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.quote_schema import (
    QuoteCreate,
    QuoteResponse,
    QuoteSearchFilters,
    QuoteSuggestionResponse,
    QuoteUpdate,
)
from src.security import get_current_employee

router = APIRouter(
    prefix='/quotes',
    tags=['Quotes'],
    dependencies=[Depends(get_current_employee)],
)


@router.post(
    '/', response_model=QuoteResponse, status_code=status.HTTP_201_CREATED
)
async def create_quote(
    data: QuoteCreate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await QuoteController.create(data, session, current_employee)


@router.get('/', response_model=list[QuoteResponse])
async def get_quotes(
    filters: Annotated[QuoteSearchFilters, Query()],
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await QuoteController.get_all(session, current_employee, filters)


@router.get('/suggestion', response_model=QuoteSuggestionResponse)
async def suggest_quote_value(
    request_id: int,
    word_count: Annotated[int | None, Query(ge=1)] = None,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await QuoteController.suggest(
        request_id, word_count, session, current_employee
    )


@router.get('/{quote_id}', response_model=QuoteResponse)
async def get_quote(
    quote_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await QuoteController.get_by_id(quote_id, session, current_employee)


@router.put('/{quote_id}', response_model=QuoteResponse)
async def update_quote(
    quote_id: int,
    data: QuoteUpdate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await QuoteController.update(
        quote_id, data, session, current_employee
    )


@router.put('/{quote_id}/approve', response_model=QuoteResponse)
async def approve_quote(
    quote_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await QuoteController.approve(quote_id, session, current_employee)


@router.put('/{quote_id}/reject', response_model=QuoteResponse)
async def reject_quote(
    quote_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await QuoteController.reject(quote_id, session, current_employee)


@router.delete('/{quote_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_quote(
    quote_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    await QuoteController.delete(quote_id, session, current_employee)
