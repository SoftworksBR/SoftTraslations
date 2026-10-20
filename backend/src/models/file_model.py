from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import table_registry

if TYPE_CHECKING:
    from src.models.request_model import Request
    from src.models.stage_model import ProjectStage


@table_registry.mapped_as_dataclass
class File:
    __tablename__ = 'files'
    __table_args__ = (
        CheckConstraint(
            '(request_id IS NOT NULL) <> (project_stage_id IS NOT NULL)',
            name='ck_files_exactly_one_context',
        ),
        CheckConstraint(
            'size_bytes IS NULL OR size_bytes >= 0',
            name='ck_files_nonnegative_size',
        ),
    )

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )

    file_path: Mapped[str] = mapped_column(nullable=False)

    original_name: Mapped[str] = mapped_column(nullable=False)

    request_id: Mapped[int | None] = mapped_column(
        ForeignKey('requests.id', ondelete='CASCADE'),
        nullable=True,
        default=None,
    )

    project_stage_id: Mapped[int | None] = mapped_column(
        ForeignKey('project_stages.id', ondelete='RESTRICT'),
        nullable=True,
        default=None,
    )
    mime_type: Mapped[str | None] = mapped_column(nullable=True, default=None)
    size_bytes: Mapped[int | None] = mapped_column(nullable=True, default=None)
    uploaded_by_id: Mapped[int | None] = mapped_column(
        ForeignKey('employees.id', ondelete='SET NULL'),
        nullable=True,
        default=None,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), init=False, server_default=func.now()
    )

    request: Mapped['Request | None'] = relationship(
        back_populates='files', init=False
    )
    project_stage: Mapped['ProjectStage | None'] = relationship(
        back_populates='files', init=False
    )


RequestFile = File
