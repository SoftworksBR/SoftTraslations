from typing import TYPE_CHECKING

from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.enums.enums import Status

from .base import table_registry

if TYPE_CHECKING:
    from src.models.path_model import Path


path_projects = Table(
    'path_projects',
    table_registry.metadata,
    Column('path_id', ForeignKey('paths.id'), primary_key=True),
    Column('project_id', ForeignKey('projects.id'), primary_key=True),
)


@table_registry.mapped_as_dataclass
class Project:
    __tablename__ = 'projects'

    id: Mapped[int] = mapped_column(
        primary_key=True, init=False, autoincrement=True
    )

    name: Mapped[str] = mapped_column(nullable=False)

    status: Mapped[Status] = mapped_column(SQLEnum(Status), nullable=False)

    creator_id: Mapped[int] = mapped_column(
        ForeignKey('employees.id'), nullable=False
    )

    paths: Mapped[list['Path']] = relationship(
        secondary=path_projects,
        back_populates='projects',
        default_factory=list,
    )
