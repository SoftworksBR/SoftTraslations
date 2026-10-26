from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import table_registry

if TYPE_CHECKING:
    from src.models.project_model import Project, ProjectPath
    from src.models.stage_model import PathStage, StageTemplate


@table_registry.mapped_as_dataclass
class Path:
    __tablename__ = 'paths'

    id: Mapped[int] = mapped_column(
        primary_key=True, init=False, autoincrement=True
    )
    name: Mapped[str] = mapped_column(String(), nullable=False)

    path_stages: Mapped[list['PathStage']] = relationship(
        back_populates='path',
        cascade='all, delete-orphan',
        default_factory=list,
        order_by='PathStage.sequence',
    )
    project_paths: Mapped[list['ProjectPath']] = relationship(
        back_populates='path',
        cascade='all, delete-orphan',
        default_factory=list,
        order_by='ProjectPath.sequence',
    )

    @property
    def stages(self) -> list['StageTemplate']:
        return [path_stage.stage_template for path_stage in self.path_stages]

    @property
    def projects(self) -> list['Project']:
        return [project_path.project for project_path in self.project_paths]
