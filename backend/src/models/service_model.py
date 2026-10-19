
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column

from .base import table_registry


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
        init=False,
        server_default=func.now(),
    )