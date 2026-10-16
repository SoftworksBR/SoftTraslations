from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class PrecoTraducaoCreate(BaseModel):
    servico_id: int = Field(gt=0)
    idioma_origem_id: int = Field(gt=0)
    idioma_destino_id: int = Field(gt=0)
    preco_por_palavra: Decimal = Field(gt=0, max_digits=10, decimal_places=4)

    @model_validator(mode='after')
    def validar_idiomas_diferentes(self):
        if self.idioma_origem_id == self.idioma_destino_id:
            raise ValueError('Os idiomas de origem e destino devem ser diferentes.')
        return self


class PrecoTraducaoUpdate(BaseModel):
    servico_id: int | None = Field(default=None, gt=0)
    idioma_origem_id: int | None = Field(default=None, gt=0)
    idioma_destino_id: int | None = Field(default=None, gt=0)
    preco_por_palavra: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=10,
        decimal_places=4,
    )
    ativo: bool | None = None


class PrecoTraducaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    servico_id: int
    idioma_origem_id: int
    idioma_destino_id: int
    preco_por_palavra: Decimal
    ativo: bool