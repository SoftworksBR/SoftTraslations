
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column

from .base import table_registry


@table_registry.mapped_as_dataclass
class Servico:
    __tablename__ = 'servicos'

    id: Mapped[int] = mapped_column(
        init=False,
        primary_key=True,
        autoincrement=True,
    )

    nome: Mapped[str] = mapped_column(
        unique=True,
        nullable=False,
    )

    descricao: Mapped[str | None] = mapped_column(
        default=None,
        nullable=True,
    )

    ativo: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )

    criado_em: Mapped[datetime] = mapped_column(
        init=False,
        server_default=func.now(),
    )
