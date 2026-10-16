from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import table_registry


@table_registry.mapped_as_dataclass
class PrecoTraducao:
    __tablename__ = 'precos_traducao'

    __table_args__ = (
        UniqueConstraint(
            'servico_id',
            'idioma_origem_id',
            'idioma_destino_id',
            name='uq_preco_servico_idiomas',
        ),
    )

    id: Mapped[int] = mapped_column(
        init=False,
        primary_key=True,
        autoincrement=True,
    )

    servico_id: Mapped[int] = mapped_column(
        ForeignKey('servicos.id'),
        nullable=False,
    )

    idioma_origem_id: Mapped[int] = mapped_column(
        ForeignKey('idiomas.id'),
        nullable=False,
    )

    idioma_destino_id: Mapped[int] = mapped_column(
        ForeignKey('idiomas.id'),
        nullable=False,
    )

    preco_por_palavra: Mapped[Decimal] = mapped_column(
        Numeric(10, 4),
        nullable=False,
    )

    ativo: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )
