from typing import TYPE_CHECKING

from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.project_model import path_projects

from .base import table_registry

if TYPE_CHECKING:
    from src.models.project_model import Project
    from src.models.stage_model import Stage


path_stages = Table(
    'path_stages',
    table_registry.metadata,
    Column('path_id', ForeignKey('paths.id'), primary_key=True),
    Column('stage_id', ForeignKey('stages.id'), primary_key=True),
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
        default_factory=list,
    )
    projects: Mapped[list['Project']] = relationship(
        secondary=path_projects,
        back_populates='paths',
        default_factory=list,
    )
