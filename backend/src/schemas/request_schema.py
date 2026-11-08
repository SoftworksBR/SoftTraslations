from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from src.enums.enums import QuoteStatus, RequestStatus


class RequestCreate(BaseModel):
    username: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=30)
    company: str | None = Field(default=None, max_length=120)
    source_language_id: int
    target_language_id: int
    service_id: int | None = None
    observations: str | None = Field(default=None, max_length=2000)
    word_count: int | None = Field(default=None, ge=1)


class RequestPublicUpdate(BaseModel):
    """Campos que o próprio cliente pode corrigir enquanto pendente."""

    username: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=1, max_length=30)
    company: str | None = Field(default=None, max_length=120)
    source_language_id: int | None = None
    target_language_id: int | None = None
    service_id: int | None = None
    observations: str | None = Field(default=None, max_length=2000)
    word_count: int | None = Field(default=None, ge=1)


class RequestUpdate(RequestPublicUpdate):
    """Campos que o atendimento pode alterar."""

    employee_id: int | None = None
    status: RequestStatus | None = None


class RequestSearchFilters(BaseModel):
    username: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    source_language_id: int | None = None
    target_language_id: int | None = None
    service_id: int | None = None
    status: RequestStatus | None = None


class RequestFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_name: str


class RequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    phone: str
    company: str | None
    source_language_id: int
    target_language_id: int
    source_language_name: str
    target_language_name: str
    service_id: int | None
    service_name: str | None
    observations: str | None
    word_count: int | None
    employee_id: int | None
    status: RequestStatus
    created_at: datetime


class RequestCreatedResponse(RequestResponse):
    """Resposta da criação: inclui o token que só o cliente recebe."""

    public_token: str


class PublicQuoteSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    value: float
    deadline: date
    observations: str | None
    status: QuoteStatus


class RequestPublicResponse(RequestResponse):
    public_token: str
    files: list[RequestFileResponse] = []
    quote: PublicQuoteSummary | None = None


class LanguageOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str | None


class ServiceOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None


class RequestOptionsResponse(BaseModel):
    languages: list[LanguageOption]
    services: list[ServiceOption]
