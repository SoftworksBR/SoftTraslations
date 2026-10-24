from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import table_registry

if TYPE_CHECKING:
    from src.models.request_model import Request
    from src.models.translation_price_model import TranslationPrice


@table_registry.mapped_as_dataclass
class Service:
    __tablename__ = 'services'

    id: Mapped[int] = mapped_column(
        init=False,
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        unique=True,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        default=None,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        init=False,
        server_default=func.now(),
    )
    requests: Mapped[list['Request']] = relationship(
        back_populates='service', init=False
    )
    translation_prices: Mapped[list['TranslationPrice']] = relationship(
        back_populates='service', init=False
    )
