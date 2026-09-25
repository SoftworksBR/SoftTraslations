from datetime import datetime

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import table_registry


@table_registry.mapped_as_dataclass
class Empresa:
    __tablename__ = 'empresas'

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    razao_social: Mapped[str] = mapped_column(nullable=False)
    cnpj: Mapped[str] = mapped_column(unique=True, nullable=False)
    criada_em: Mapped[datetime] = mapped_column(
        init=False, server_default=func.now()
    )

    departamentos: Mapped[list['Departamento']] = relationship(
        back_populates='empresa',
        cascade='all, delete-orphan',
        default_factory=list,
    )


@table_registry.mapped_as_dataclass
class Departamento:
    __tablename__ = 'departamentos'

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    nome: Mapped[str] = mapped_column(nullable=False)
    empresa_id: Mapped[int] = mapped_column(
        ForeignKey('empresas.id'), nullable=False, init=False
    )

    empresa: Mapped['Empresa'] = relationship(
        back_populates='departamentos', init=False
    )
    contatos: Mapped[list['Contato']] = relationship(
        back_populates='departamento',
        cascade='all, delete-orphan',
        default_factory=list,
    )


@table_registry.mapped_as_dataclass
class Contato:
    __tablename__ = 'contatos'

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    nome: Mapped[str] = mapped_column(nullable=False)
    email: Mapped[str] = mapped_column(nullable=False)
    telefone: Mapped[str] = mapped_column(nullable=False)
    cargo: Mapped[str | None] = mapped_column(nullable=True, default=None)
    departamento_id: Mapped[int] = mapped_column(
        ForeignKey('departamentos.id'), nullable=False, init=False
    )

    departamento: Mapped['Departamento'] = relationship(
        back_populates='contatos', init=False
    )
