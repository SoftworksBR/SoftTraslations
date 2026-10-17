
from sqlalchemy.orm import Mapped, mapped_column

from .base import table_registry


@table_registry.mapped_as_dataclass
class Language:
    __tablename__ = 'languages'

    id: Mapped[int] = mapped_column(
        init=False,
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(nullable=False)

    code: Mapped[str | None] = mapped_column(
        default=None,
        unique=True,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )
