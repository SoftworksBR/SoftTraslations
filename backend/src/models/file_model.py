from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, registry

table_registry = registry()


@table_registry.mapped_as_dataclass
class RequestFile:
    __tablename__ = 'request_files'

    id: Mapped[int] = mapped_column(primary_key=True)

    file_path: Mapped[str] = mapped_column(nullable=False)

    request_id: Mapped[int] = mapped_column(
        ForeignKey('requests.id'), nullable=False
    )


@table_registry.mapped_as_dataclass
class StageFile:
    __tablename__ = 'stage_files'

    id: Mapped[int] = mapped_column(primary_key=True)

    file_path: Mapped[str] = mapped_column(nullable=False)

    stage_id: Mapped[int] = mapped_column(
        ForeignKey('stages.id'), nullable=False
    )
