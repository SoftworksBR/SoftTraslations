
from sqlalchemy.orm import Mapped, mapped_column

from .base import table_registry


@table_registry.mapped_as_dataclass
class Idioma:
    __tablename__ = 'idiomas'

    id: Mapped[int] = mapped_column(
        init=False,
        primary_key=True,
        autoincrement=True,
    )

    nome: Mapped[str] = mapped_column(
        nullable=False,
    )

    codigo: Mapped[str | None] = mapped_column(
        default=None,
        unique=True,
        nullable=True,
    )

    ativo: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )
