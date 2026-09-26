import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from pydantic_core import PydanticCustomError

FORMATO_CNPJ = re.compile(r'[A-Z0-9]{12}[0-9]{2}')
MENSAGEM_CNPJ_INVALIDO = 'CNPJ inválido.'


def _digito_verificador(base: str) -> str:
    digitos = ''

    for tamanho in (12, 13):
        pesos = [(posicao % 8) + 2 for posicao in range(tamanho)][::-1]
        soma = sum(
            (ord(caractere) - ord('0')) * peso
            for caractere, peso in zip((base + digitos)[:tamanho], pesos)
        )
        resto = soma % 11
        digitos += str(0 if resto < 2 else 11 - resto)  # noqa: PLR2004

    return digitos


def normalizar_cnpj(valor: str) -> str:
    cnpj = re.sub(r'[.\-/\s]', '', valor).upper()

    if not FORMATO_CNPJ.fullmatch(cnpj) or (
        _digito_verificador(cnpj[:12]) != cnpj[12:]
    ):
        raise PydanticCustomError('cnpj_invalido', MENSAGEM_CNPJ_INVALIDO)

    return cnpj


class ContatoCriacao(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str = Field(min_length=1)
    email: EmailStr
    telefone: str = Field(min_length=1)
    cargo: str | None = None


class DepartamentoCriacao(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str = Field(min_length=1)
    contatos: list[ContatoCriacao] = Field(default_factory=list)


class EmpresaCriacao(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    razao_social: str = Field(min_length=1)
    cnpj: str
    departamentos: list[DepartamentoCriacao] = Field(default_factory=list)

    @field_validator('cnpj')
    @classmethod
    def validar_cnpj(cls, valor: str) -> str:
        return normalizar_cnpj(valor)


class FiltroEmpresa(BaseModel):
    limit: int = Field(10, ge=1, le=100)
    offset: int = Field(0, ge=0)
    razao_social: str | None = None
    cnpj: str | None = None

    @field_validator('cnpj')
    @classmethod
    def limpar_cnpj(cls, valor: str | None) -> str | None:
        if valor is None:
            return None

        return re.sub(r'[.\-/\s]', '', valor).upper()


class ContatoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str
    telefone: str
    cargo: str | None


class DepartamentoResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    contatos: list[ContatoResposta]


class EmpresaResposta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    razao_social: str
    cnpj: str
    departamentos: list[DepartamentoResposta]
