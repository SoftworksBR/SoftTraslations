import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from pydantic_core import PydanticCustomError

CNPJ_FORMAT = re.compile(r'[A-Z0-9]{12}[0-9]{2}')
CNPJ_INVALID_MESSAGE = 'CNPJ inválido.'


def _check_digits(base: str) -> str:
    digits = ''

    for length in (12, 13):
        weights = [(position % 8) + 2 for position in range(length)][::-1]
        total = sum(
            (ord(character) - ord('0')) * weight
            for character, weight in zip((base + digits)[:length], weights)
        )
        remainder = total % 11
        digits += str(0 if remainder < 2 else 11 - remainder)  # noqa: PLR2004

    return digits


def normalize_cnpj(value: str) -> str:
    cnpj = re.sub(r'[.\-/\s]', '', value).upper()

    if not CNPJ_FORMAT.fullmatch(cnpj) or (
        _check_digits(cnpj[:12]) != cnpj[12:]
    ):
        raise PydanticCustomError('invalid_cnpj', CNPJ_INVALID_MESSAGE)

    return cnpj


class ContactCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1)
    email: EmailStr
    phone: str = Field(min_length=1)
    job_title: str | None = None


class DepartmentCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1)
    contacts: list[ContactCreate] = Field(default_factory=list)


class CompanyCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1)
    cnpj: str
    departments: list[DepartmentCreate] = Field(default_factory=list)

    @field_validator('cnpj')
    @classmethod
    def validate_cnpj(cls, value: str) -> str:
        return normalize_cnpj(value)


class CompanyFilter(BaseModel):
    limit: int = Field(10, ge=1, le=100)
    offset: int = Field(0, ge=0)
    name: str | None = None
    cnpj: str | None = None

    @field_validator('cnpj')
    @classmethod
    def clean_cnpj(cls, value: str | None) -> str | None:
        if value is None:
            return None

        return re.sub(r'[.\-/\s]', '', value).upper()


class ContactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    phone: str
    job_title: str | None


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    contacts: list[ContactResponse]


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    cnpj: str
    departments: list[DepartmentResponse]
