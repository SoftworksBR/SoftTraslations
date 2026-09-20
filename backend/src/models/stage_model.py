from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from src.enums.enums import Status

from .base import table_registry


@table_registry.mapped_as_dataclass
class Stage:
    __tablename__ = 'stages'

    id: Mapped[int] = mapped_column(primary_key=True)
    freelancer_id: Mapped[int] = mapped_column(
        ForeignKey('employees.id'), nullable=False
    )
    status: Mapped[Status] = mapped_column(SQLEnum(Status), nullable=False)
