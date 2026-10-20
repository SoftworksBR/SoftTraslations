from datetime import datetime

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.enums.enums import RequestStatus

from .base import table_registry
from .language_model import Language
from .service_model import Service


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

    source_language_id: Mapped[int] = mapped_column(
        ForeignKey('languages.id'),
        nullable=False,
    )

    target_language_id: Mapped[int] = mapped_column(
        ForeignKey('languages.id'),
        nullable=False,
    )

    # Token entregue ao cliente (que não tem login) para acompanhar,
    # editar e anexar arquivos à própria solicitação.
    public_token: Mapped[str] = mapped_column(
        unique=True,
        index=True,
        nullable=False,
    )

    service_id: Mapped[int | None] = mapped_column(
        ForeignKey('services.id'),
        nullable=True,
        default=None,
    )

    observations: Mapped[str | None] = mapped_column(
        nullable=True,
        default=None,
    )

    word_count: Mapped[int | None] = mapped_column(
        nullable=True,
        default=None,
    )

    # Preenchido pelo atendente quando assume a solicitação.
    employee_id: Mapped[int | None] = mapped_column(
        ForeignKey('employees.id'),
        nullable=True,
        default=None,
    )

    status: Mapped[RequestStatus] = mapped_column(
        SQLEnum(RequestStatus, name='request_status'),
        nullable=False,
        default=RequestStatus.PENDING,
    )

    created_at: Mapped[datetime] = mapped_column(
        init=False,
        server_default=func.now(),
    )

    service: Mapped[Service | None] = relationship(
        init=False,
        lazy='joined',
    )

    source_language: Mapped[Language] = relationship(
        init=False,
        lazy='joined',
        foreign_keys=[source_language_id],
    )

    target_language: Mapped[Language] = relationship(
        init=False,
        lazy='joined',
        foreign_keys=[target_language_id],
    )

    @property
    def service_name(self) -> str | None:
        return self.service.name if self.service else None

    @property
    def source_language_name(self) -> str:
        return self.source_language.name

    @property
    def target_language_name(self) -> str:
        return self.target_language.name
