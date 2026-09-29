from typing import TYPE_CHECKING

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.enums.enums import FreelancerType, Status
from src.models.path_model import path_stages

from .base import table_registry

if TYPE_CHECKING:
    from src.models.path_model import Path


@table_registry.mapped_as_dataclass
class Stage:
    __tablename__ = 'stages'

    id: Mapped[int] = mapped_column(
        primary_key=True, init=False, autoincrement=True
    )

    name: Mapped[str] = mapped_column(nullable=False)

    status: Mapped[Status] = mapped_column(SQLEnum(Status), nullable=False)

    freelancer_id: Mapped[int | None] = mapped_column(
        ForeignKey('employees.id'), nullable=True, default=None
    )

    freelancer_type: Mapped[FreelancerType | None] = mapped_column(
        SQLEnum(
            FreelancerType,
            name='freelancer_type',
            values_callable=lambda enum: [member.value for member in enum],
        ),
        nullable=True,
        default=None,
    )

    paths: Mapped[list['Path']] = relationship(
        secondary=path_stages,
        back_populates='stages',
        order_by=path_stages.c.id,
        default_factory=list,
    )
