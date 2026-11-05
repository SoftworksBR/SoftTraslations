from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, func
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.enums.enums import QuoteStatus

from .base import table_registry
from .request_model import Request

if TYPE_CHECKING:
    from src.models.employee_model import Employee


@table_registry.mapped_as_dataclass
class Quote:
    """Orçamento feito pelo atendimento a partir de uma solicitação."""

    __tablename__ = 'quotes'
    __table_args__ = (
        CheckConstraint('value >= 0', name='ck_quotes_value_nonnegative'),
        CheckConstraint(
            "(status = 'in_review' AND approved_by_id IS NULL "
            'AND approved_at IS NULL) OR '
            "(status IN ('approved', 'rejected') AND "
            'approved_by_id IS NOT NULL AND approved_at IS NOT NULL)',
            name='ck_quotes_approval_consistency',
        ),
    )

    id: Mapped[int] = mapped_column(
        init=False,
        primary_key=True,
        autoincrement=True,
    )

    request_id: Mapped[int] = mapped_column(
        ForeignKey('requests.id'),
        unique=True,
        nullable=False,
    )

    value: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    deadline: Mapped[date] = mapped_column(nullable=False)

    created_by_id: Mapped[int] = mapped_column(
        ForeignKey('employees.id'),
        nullable=False,
    )

    observations: Mapped[str | None] = mapped_column(
        nullable=True,
        default=None,
    )

    status: Mapped[QuoteStatus] = mapped_column(
        SQLEnum(
            QuoteStatus,
            name='quote_status',
            values_callable=lambda enum: [member.value for member in enum],
        ),
        nullable=False,
        default=QuoteStatus.IN_REVIEW,
    )

    approved_by_id: Mapped[int | None] = mapped_column(
        ForeignKey('employees.id'),
        nullable=True,
        default=None,
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        init=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        init=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    request: Mapped[Request] = relationship(init=False, lazy='joined')
    created_by: Mapped['Employee'] = relationship(
        back_populates='quotes_created',
        init=False,
        foreign_keys=[created_by_id],
    )
    approved_by: Mapped['Employee | None'] = relationship(
        back_populates='quotes_approved',
        init=False,
        foreign_keys=[approved_by_id],
    )

    @property
    def client_name(self) -> str:
        return self.request.username

    @property
    def client_email(self) -> str:
        return self.request.email

    @property
    def service_name(self) -> str | None:
        return self.request.service_name

    @property
    def source_language_name(self) -> str:
        return self.request.source_language_name

    @property
    def target_language_name(self) -> str:
        return self.request.target_language_name
