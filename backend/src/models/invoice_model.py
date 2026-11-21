from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import table_registry


@table_registry.mapped_as_dataclass
class PaymentInvoice:
    __tablename__ = 'payment_invoices'

    id: Mapped[int] = mapped_column(
        primary_key=True, init=False, autoincrement=True
    )
    invoice_number: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False
    )
    freelancer_id: Mapped[int] = mapped_column(
        ForeignKey('employees.id', ondelete='RESTRICT'), nullable=False
    )
    created_by_id: Mapped[int] = mapped_column(
        ForeignKey('employees.id', ondelete='RESTRICT'), nullable=False
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    issued_on: Mapped[date] = mapped_column(Date, nullable=False)
    project_id: Mapped[int | None] = mapped_column(
        ForeignKey('projects.id', ondelete='SET NULL'),
        nullable=True,
        default=None,
    )
    stage_id: Mapped[int | None] = mapped_column(
        ForeignKey('project_stages.id', ondelete='SET NULL'),
        nullable=True,
        default=None,
    )
    emailed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), init=False, server_default=func.now()
    )
