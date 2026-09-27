from datetime import datetime

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import table_registry


@table_registry.mapped_as_dataclass
class Company:
    __tablename__ = 'companies'

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    name: Mapped[str] = mapped_column(nullable=False)
    cnpj: Mapped[str] = mapped_column(unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        init=False, server_default=func.now()
    )

    departments: Mapped[list['Department']] = relationship(
        back_populates='company',
        cascade='all, delete-orphan',
        default_factory=list,
    )


@table_registry.mapped_as_dataclass
class Department:
    __tablename__ = 'departments'

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    name: Mapped[str] = mapped_column(nullable=False)
    company_id: Mapped[int] = mapped_column(
        ForeignKey('companies.id'), nullable=False, init=False
    )

    company: Mapped['Company'] = relationship(
        back_populates='departments', init=False
    )
    contacts: Mapped[list['Contact']] = relationship(
        back_populates='department',
        cascade='all, delete-orphan',
        default_factory=list,
    )


@table_registry.mapped_as_dataclass
class Contact:
    __tablename__ = 'contacts'

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    name: Mapped[str] = mapped_column(nullable=False)
    email: Mapped[str] = mapped_column(nullable=False)
    phone: Mapped[str] = mapped_column(nullable=False)
    job_title: Mapped[str | None] = mapped_column(nullable=True, default=None)
    department_id: Mapped[int] = mapped_column(
        ForeignKey('departments.id'), nullable=False, init=False
    )

    department: Mapped['Department'] = relationship(
        back_populates='contacts', init=False
    )
