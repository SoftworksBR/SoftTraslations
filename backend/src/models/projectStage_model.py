from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry

table_registry = registry()


@table_registry.mapped_as_dataclass
class ProjectStage:
    __tablename__ = 'project_stages'

    project_id: Mapped[int] = mapped_column(
        ForeignKey('projects.id'), primary_key=True
    )

    stage_id: Mapped[int] = mapped_column(
        ForeignKey('stages.id'), primary_key=True
    )
