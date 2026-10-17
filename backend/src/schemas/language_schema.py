
from pydantic import BaseModel, ConfigDict, Field


class LanguageCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100)
    code: str | None = Field(default=None, min_length=2, max_length=10)


class LanguageUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=100)
    code: str | None = Field(default=None, min_length=2, max_length=10)
    is_active: bool | None = None


class LanguageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str | None
    is_active: bool
