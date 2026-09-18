from sqlalchemy import Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry

from enums.enums import Status

table_registry = registry()

@table_registry.mapped_as_dataclass
class Stage():
    __tablename__ = "stages"

    id: Mapped[int] = mapped_column(primary_key=True)
    freelancer_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id"),
        nullable=False
    )
    status: Mapped[Status] = mapped_column(
        SQLEnum(Status),
        nullable=False
    )