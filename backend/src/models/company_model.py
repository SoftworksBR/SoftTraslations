from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import table_registry


@table_registry.mapped_as_dataclass
class Company:
    __tablename__ = 'companies'

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    name: Mapped[str] = mapped_column(nullable=False)
    primary_email: Mapped[str | None] = mapped_column(
        nullable=True, default=None
    )
    website: Mapped[str | None] = mapped_column(nullable=True, default=None)
    primary_phone: Mapped[str | None] = mapped_column(
        nullable=True, default=None
    )
    general_info: Mapped[str | None] = mapped_column(
        nullable=True, default=None
    )
    is_legal_entity: Mapped[bool] = mapped_column(default=True, nullable=False)
    tax_id: Mapped[str | None] = mapped_column(
        unique=True, nullable=True, default=None
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), init=False, server_default=func.now()
    )
    employees: Mapped[list['CompanyEmployee']] = relationship(
        back_populates='company',
        cascade='all, delete-orphan',
        default_factory=list,
    )


@table_registry.mapped_as_dataclass
class CompanyEmployee:
    __tablename__ = 'company_employees'

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    company_id: Mapped[int] = mapped_column(
        ForeignKey('companies.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    first_name: Mapped[str] = mapped_column(nullable=False)
    last_name: Mapped[str] = mapped_column(nullable=False)
    email: Mapped[str] = mapped_column(nullable=False)
    phone: Mapped[str | None] = mapped_column(nullable=True, default=None)
    general_info: Mapped[str | None] = mapped_column(
        nullable=True, default=None
    )
    company: Mapped[Company] = relationship(
        back_populates='employees', init=False
    )


@table_registry.mapped_as_dataclass
class Person:
    __tablename__ = 'people'

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    first_name: Mapped[str] = mapped_column(nullable=False)
    last_name: Mapped[str] = mapped_column(nullable=False)
    email: Mapped[str] = mapped_column(nullable=False)
    phone: Mapped[str | None] = mapped_column(nullable=True, default=None)
    general_info: Mapped[str | None] = mapped_column(
        nullable=True, default=None
    )
    is_natural_person: Mapped[bool] = mapped_column(
        default=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), init=False, server_default=func.now()
    )
