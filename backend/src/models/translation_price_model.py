from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import table_registry

if TYPE_CHECKING:
    from src.models.language_model import Language
    from src.models.service_model import Service


@table_registry.mapped_as_dataclass
class TranslationPrice:
    __tablename__ = 'translation_prices'

    __table_args__ = (
        UniqueConstraint(
            'service_id',
            'source_language_id',
            'target_language_id',
            name='uq_translation_price_languages',
        ),
        CheckConstraint(
            'price_per_word >= 0',
            name='ck_translation_prices_nonnegative',
        ),
    )

    id: Mapped[int] = mapped_column(
        init=False,
        primary_key=True,
        autoincrement=True,
    )

    service_id: Mapped[int] = mapped_column(
        ForeignKey('services.id'),
        nullable=False,
    )

    source_language_id: Mapped[int] = mapped_column(
        ForeignKey('languages.id'),
        nullable=False,
    )

    target_language_id: Mapped[int] = mapped_column(
        ForeignKey('languages.id'),
        nullable=False,
    )

    price_per_word: Mapped[Decimal] = mapped_column(
        Numeric(10, 4),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )
    service: Mapped['Service'] = relationship(
        back_populates='translation_prices', init=False
    )
    source_language: Mapped['Language'] = relationship(
        init=False,
        foreign_keys=[source_language_id],
    )
    target_language: Mapped['Language'] = relationship(
        init=False,
        foreign_keys=[target_language_id],
    )
