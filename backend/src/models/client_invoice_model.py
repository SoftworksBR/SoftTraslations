from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import table_registry


@table_registry.mapped_as_dataclass
class ClientInvoice:
    """Fatura emitida para um cliente a partir de um orçamento aprovado."""

    __tablename__ = 'client_invoices'

    id: Mapped[int] = mapped_column(
        primary_key=True,
        init=False,
        autoincrement=True,
    )

    invoice_number: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
    )

    quote_id: Mapped[int] = mapped_column(
        ForeignKey('quotes.id', ondelete='RESTRICT'),
        unique=True,
        nullable=False,
    )

    created_by_id: Mapped[int] = mapped_column(
        ForeignKey('employees.id', ondelete='RESTRICT'),
        nullable=False,
    )

    client_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    client_email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    issued_on: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    emailed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        init=False,
        server_default=func.now(),
    )
