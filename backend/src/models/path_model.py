from typing import TYPE_CHECKING

from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Table,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.project_model import path_projects

from .base import table_registry

if TYPE_CHECKING:
    from src.models.project_model import Project
    from src.models.stage_model import Stage


# 'id' preserva a ordem de inserção (a ordem que o gestor escolheu ao montar
# a trilha), já que uma chave primária composta (path_id, stage_id) não
# garante nenhuma ordem específica na leitura.
path_stages = Table(
    'path_stages',
    table_registry.metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('path_id', ForeignKey('paths.id'), nullable=False),
    Column('stage_id', ForeignKey('stages.id'), nullable=False),
    UniqueConstraint('path_id', 'stage_id', name='uq_path_stages_path_stage'),
)


@table_registry.mapped_as_dataclass
class Path:
    __tablename__ = 'paths'

    id: Mapped[int] = mapped_column(
        primary_key=True, init=False, autoincrement=True
    )
    name: Mapped[str] = mapped_column(String(), nullable=False)

    stages: Mapped[list['Stage']] = relationship(
        secondary=path_stages,
        back_populates='paths',
        order_by=path_stages.c.id,
        default_factory=list,
    )
    projects: Mapped[list['Project']] = relationship(
        secondary=path_projects,
        back_populates='paths',
        default_factory=list,
    )
