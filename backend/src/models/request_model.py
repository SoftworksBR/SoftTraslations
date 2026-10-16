
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from .base import table_registry


@table_registry.mapped_as_dataclass
class Request:
    __tablename__ = 'requests'

    id: Mapped[int] = mapped_column(
        init=False,
        primary_key=True,
        autoincrement=True,
    )
    username: Mapped[str] = mapped_column(nullable=False)
    email: Mapped[str] = mapped_column(nullable=False)
    phone: Mapped[str] = mapped_column(nullable=False)
    company: Mapped[str | None] = mapped_column(nullable=True)

    idioma_origem_id: Mapped[int] = mapped_column(
        ForeignKey('idiomas.id'),
        nullable=False,
    )
    idioma_destino_id: Mapped[int] = mapped_column(
        ForeignKey('idiomas.id'),
        nullable=False,
    )

    observations: Mapped[str | None] = mapped_column(nullable=True)

    employee_id: Mapped[int] = mapped_column(
        ForeignKey('employees.id'),
        nullable=False,
    )
