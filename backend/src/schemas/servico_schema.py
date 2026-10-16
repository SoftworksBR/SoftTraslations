from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ServicoCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str = Field(min_length=1, max_length=100)


class ServicoUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str | None = Field(default=None, min_length=1, max_length=100)
    descricao: str | None = None
    ativo: bool | None = None


class ServicoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    descricao: str | None
    ativo: bool
    criado_em: datetime
