from pydantic import BaseModel, ConfigDict, Field


class IdiomaCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str = Field(min_length=1, max_length=100)


class IdiomaUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str | None = Field(default=None, min_length=1, max_length=100)
    ativo: bool | None = None


class IdiomaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    codigo: str | None
    ativo: bool
