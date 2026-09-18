from sqlalchemy import Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry

from enums.enums import Status

table_registry = registry()


@table_registry.mapped_as_dataclass
class Project():
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(nullable=False)
    status: Mapped[Status] = mapped_column(
        SQLEnum(Status),
        nullable=False
    )
    creator_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id"),
        nullable=False
    )