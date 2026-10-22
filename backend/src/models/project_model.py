from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, UniqueConstraint
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.enums.enums import Status

from .base import table_registry

if TYPE_CHECKING:
    from src.models.employee_model import Employee
    from src.models.path_model import Path
    from src.models.quote_model import Quote
    from src.models.stage_model import ProjectStage


@table_registry.mapped_as_dataclass
class Project:
    __tablename__ = 'projects'

    id: Mapped[int] = mapped_column(
        primary_key=True, init=False, autoincrement=True
    )

    name: Mapped[str] = mapped_column(nullable=False)

    status: Mapped[Status] = mapped_column(
        SQLEnum(
            Status,
            name='project_status',
            values_callable=lambda enum: [member.value for member in enum],
        ),
        nullable=False,
    )

    creator_id: Mapped[int] = mapped_column(
        ForeignKey('employees.id'), nullable=False
    )

    # Orçamento aprovado que originou o projeto.
    quote_id: Mapped[int | None] = mapped_column(
        ForeignKey('quotes.id'),
        unique=True,
        nullable=True,
        default=None,
    )

    project_paths: Mapped[list['ProjectPath']] = relationship(
        back_populates='project',
        cascade='all, delete-orphan',
        default_factory=list,
        order_by='ProjectPath.sequence',
    )

    creator: Mapped['Employee'] = relationship(
        back_populates='projects_created',
        init=False,
        foreign_keys=[creator_id],
    )
    quote: Mapped['Quote | None'] = relationship(
        init=False, foreign_keys=[quote_id]
    )

    @property
    def paths(self) -> list['Path']:
        return [project_path.path for project_path in self.project_paths]


@table_registry.mapped_as_dataclass
class ProjectPath:
    __tablename__ = 'project_paths'
    __table_args__ = (
        UniqueConstraint('project_id', 'sequence'),
        UniqueConstraint('project_id', 'path_id'),
        UniqueConstraint('id', 'path_id'),
        CheckConstraint('sequence > 0', name='ck_project_paths_sequence'),
    )

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    project_id: Mapped[int] = mapped_column(
        ForeignKey('projects.id', ondelete='CASCADE'), nullable=False
    )
    path_id: Mapped[int] = mapped_column(
        ForeignKey('paths.id', ondelete='RESTRICT'), nullable=False
    )
    sequence: Mapped[int] = mapped_column(nullable=False)

    project: Mapped[Project] = relationship(
        back_populates='project_paths', init=False
    )
    path: Mapped['Path'] = relationship(
        back_populates='project_paths', init=False
    )
    executions: Mapped[list['ProjectStage']] = relationship(
        back_populates='project_path',
        cascade='all, delete-orphan',
        default_factory=list,
        foreign_keys='ProjectStage.project_path_id',
    )
