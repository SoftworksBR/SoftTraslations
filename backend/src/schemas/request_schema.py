
from pydantic import BaseModel, ConfigDict


class RequestCreate(BaseModel):
    username: str
    email: str
    phone: str
    company: str | None = None
    source_language_id: int
    target_language_id: int
    observations: str | None = None
    employee_id: int


class RequestUpdate(BaseModel):
    username: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    source_language_id: int | None = None
    target_language_id: int | None = None
    observations: str | None = None
    employee_id: int | None = None


class RequestSearchFilters(BaseModel):
    username: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    translate_from: Translations | None = None
    translate_to: Translations | None = None


class RequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    phone: str
    company: str | None
    source_language_id: int
    target_language_id: int
    observations: str | None
    employee_id: int
