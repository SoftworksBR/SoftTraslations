from pydantic import BaseModel, ConfigDict

from src.enums.enums import Translations


class RequestCreate(BaseModel):
    username: str
    email: str
    phone: str
    company: str | None = None
    translate_from: Translations
    translate_to: Translations
    observations: str | None = None
    employee_id: int


class RequestUpdate(BaseModel):
    username: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    translate_from: Translations | None = None
    translate_to: Translations | None = None
    observations: str | None = None
    employee_id: int | None = None


class RequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    phone: str
    company: str | None
    translate_from: Translations
    translate_to: Translations
    observations: str | None
    employee_id: int