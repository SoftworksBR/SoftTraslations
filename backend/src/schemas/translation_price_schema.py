
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TranslationPriceCreate(BaseModel):
    service_id: int = Field(gt=0)
    source_language_id: int = Field(gt=0)
    target_language_id: int = Field(gt=0)
    price_per_word: Decimal = Field(gt=0, max_digits=10, decimal_places=4)

    @model_validator(mode='after')
    def validate_different_languages(self):
        if self.source_language_id == self.target_language_id:
            raise ValueError('Source and target languages must be different.')
        return self


class TranslationPriceUpdate(BaseModel):
    service_id: int | None = Field(default=None, gt=0)
    source_language_id: int | None = Field(default=None, gt=0)
    target_language_id: int | None = Field(default=None, gt=0)
    price_per_word: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=10,
        decimal_places=4,
    )
    is_active: bool | None = None


class TranslationPriceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    service_id: int
    source_language_id: int
    target_language_id: int
    price_per_word: Decimal
    is_active: bool
