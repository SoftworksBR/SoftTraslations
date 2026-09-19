from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import table_registry
from src.enums.enums import Status
from src.models.project_model import project_stages

if TYPE_CHECKING:
    from src.models.project_model import Project


@table_registry.mapped_as_dataclass
class Stage:

    __tablename__ = "stages"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        init=False,
        autoincrement=True
    )

    freelancer_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id"),
        nullable=False
    )

    status: Mapped[Status] = mapped_column(
        SQLEnum(Status),
        nullable=False
    )

    projects: Mapped[list["Project"]] = relationship(
        secondary=project_stages,
        back_populates="stages"
    )