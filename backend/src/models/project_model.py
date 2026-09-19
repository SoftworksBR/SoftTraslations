from typing import TYPE_CHECKING

from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import table_registry
from src.enums.enums import Status

if TYPE_CHECKING:
    from src.models.stage_model import Stage


project_stages = Table(
    "project_stages",
    table_registry.metadata,

    Column(
        "project_id",
        ForeignKey("projects.id"),
        primary_key=True
    ),

    Column(
        "stage_id",
        ForeignKey("stages.id"),
        primary_key=True
    )
)


@table_registry.mapped_as_dataclass
class Project:

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        init=False,
        autoincrement=True
    )

    name: Mapped[str] = mapped_column(
        nullable=False
    )

    status: Mapped[Status] = mapped_column(
        SQLEnum(Status),
        nullable=False
    )

    creator_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id"),
        nullable=False
    )

    stages: Mapped[list["Stage"]] = relationship(
        secondary=project_stages,
        back_populates="projects"
    )