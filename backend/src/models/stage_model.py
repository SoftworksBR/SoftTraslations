from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    UniqueConstraint,
    func,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.enums.enums import Status

from .base import table_registry

if TYPE_CHECKING:
    from src.models.employee_model import Employee
    from src.models.file_model import File
    from src.models.path_model import Path
    from src.models.project_model import ProjectPath


@table_registry.mapped_as_dataclass
class StageTemplate:
    __tablename__ = 'stage_templates'

    id: Mapped[int] = mapped_column(
        primary_key=True, init=False, autoincrement=True
    )

    name: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str | None] = mapped_column(
        nullable=True, default=None
    )

    path_stages: Mapped[list['PathStage']] = relationship(
        back_populates='stage_template',
        cascade='all, delete-orphan',
        default_factory=list,
    )


@table_registry.mapped_as_dataclass
class PathStage:
    __tablename__ = 'path_stages'
    __table_args__ = (
        UniqueConstraint('path_id', 'sequence'),
        UniqueConstraint('path_id', 'stage_template_id'),
        UniqueConstraint('id', 'path_id'),
        CheckConstraint('sequence > 0', name='ck_path_stages_sequence'),
    )

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    path_id: Mapped[int] = mapped_column(
        ForeignKey('paths.id', ondelete='CASCADE'),
        nullable=False,
        init=False,
    )
    stage_template_id: Mapped[int] = mapped_column(
        ForeignKey('stage_templates.id', ondelete='RESTRICT'),
        nullable=False,
    )
    sequence: Mapped[int] = mapped_column(nullable=False)

    path: Mapped['Path'] = relationship(
        back_populates='path_stages', init=False
    )
    stage_template: Mapped[StageTemplate] = relationship(
        back_populates='path_stages', init=False
    )


@table_registry.mapped_as_dataclass
class ProjectStage:
    __tablename__ = 'project_stages'
    __table_args__ = (
        ForeignKeyConstraint(
            ['project_path_id', 'path_id'],
            ['project_paths.id', 'project_paths.path_id'],
            ondelete='CASCADE',
            name='fk_project_stages_project_path',
        ),
        ForeignKeyConstraint(
            ['path_stage_id', 'path_id'],
            ['path_stages.id', 'path_stages.path_id'],
            ondelete='RESTRICT',
            name='fk_project_stages_path_stage',
        ),
        UniqueConstraint('project_path_id', 'path_stage_id'),
        CheckConstraint(
            'completed_at IS NULL OR started_at IS NOT NULL',
            name='ck_project_stages_completion_requires_start',
        ),
        CheckConstraint(
            'started_at IS NULL OR completed_at IS NULL '
            'OR completed_at >= started_at',
            name='ck_project_stages_valid_dates',
        ),
    )

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    project_path_id: Mapped[int] = mapped_column(nullable=False)
    path_stage_id: Mapped[int] = mapped_column(nullable=False)
    path_id: Mapped[int] = mapped_column(nullable=False)
    freelancer_id: Mapped[int | None] = mapped_column(
        ForeignKey('employees.id', ondelete='SET NULL'),
        nullable=True,
        default=None,
    )
    status: Mapped[Status] = mapped_column(
        SQLEnum(
            Status,
            name='project_status',
            values_callable=lambda enum: [member.value for member in enum],
        ),
        nullable=False,
        default=Status.READY,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), init=False, server_default=func.now()
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )

    project_path: Mapped['ProjectPath'] = relationship(
        back_populates='executions',
        init=False,
        foreign_keys=[project_path_id, path_id],
    )
    path_stage: Mapped[PathStage] = relationship(
        init=False,
        foreign_keys=[path_stage_id, path_id],
        viewonly=True,
    )
    freelancer: Mapped['Employee | None'] = relationship(
        back_populates='assigned_project_stages',
        init=False,
        foreign_keys=[freelancer_id],
    )
    files: Mapped[list['File']] = relationship(
        back_populates='project_stage', init=False
    )

    @property
    def name(self) -> str:
        return self.path_stage.stage_template.name

    @property
    def paths(self) -> list['Path']:
        return [self.project_path.path]


Stage = ProjectStage
