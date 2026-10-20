from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from src.enums.enums import QuoteStatus


class QuoteCreate(BaseModel):
    request_id: int
    value: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    deadline: date
    observations: str | None = Field(default=None, max_length=2000)


class QuoteUpdate(BaseModel):
    value: Decimal | None = Field(
        default=None, gt=0, max_digits=12, decimal_places=2
    )
    deadline: date | None = None
    observations: str | None = Field(default=None, max_length=2000)


class QuoteSearchFilters(BaseModel):
    status: QuoteStatus | None = None
    request_id: int | None = None
    client_name: str | None = None
    # Aprovados que ainda não geraram projeto (usado pelo gestor).
    available_for_project: bool | None = None


class QuoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    request_id: int
    value: float
    deadline: date
    observations: str | None
    status: QuoteStatus
    created_by_id: int
    approved_by_id: int | None
    approved_at: datetime | None
    created_at: datetime

    # Dados da solicitação, para as telas não precisarem de outra consulta.
    client_name: str
    client_email: str
    service_name: str | None
    source_language_name: str
    target_language_name: str


class QuoteSuggestionResponse(BaseModel):
    request_id: int
    word_count: int | None
    price_per_word: float | None
    suggested_value: float | None
