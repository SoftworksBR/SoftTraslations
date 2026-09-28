from typing import TYPE_CHECKING

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.enums.enums import Status

from .base import table_registry

if TYPE_CHECKING:
    from src.models.path_model import Path


@table_registry.mapped_as_dataclass
class Stage:
    __tablename__ = 'stages'

    id: Mapped[int] = mapped_column(
        primary_key=True, init=False, autoincrement=True
    )

    freelancer_id: Mapped[int] = mapped_column(
        ForeignKey('employees.id'), nullable=False
    )

    path_id: Mapped[int] = mapped_column(
        ForeignKey('paths.id'), init=False
    )

    status: Mapped[Status] = mapped_column(SQLEnum(Status), nullable=False)

    path: Mapped['Path'] = relationship(
        back_populates='stages',
    )
