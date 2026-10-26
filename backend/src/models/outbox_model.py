from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import table_registry


@table_registry.mapped_as_dataclass
class OutboxEvent:
    __tablename__ = 'outbox_events'
    __table_args__ = (
        Index('ix_outbox_events_pending', 'processed_at', 'next_attempt_at'),
    )

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    event_type: Mapped[str] = mapped_column(String(120), nullable=False)
    aggregate_type: Mapped[str] = mapped_column(String(80), nullable=False)
    aggregate_id: Mapped[int] = mapped_column(Integer, nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    event_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        default_factory=uuid4,
        unique=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), init=False, server_default=func.now()
    )
    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), init=False, nullable=True, default=None
    )
    attempts: Mapped[int] = mapped_column(default=0, nullable=False)
    next_attempt_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), init=False, server_default=func.now()
    )
    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), init=False, nullable=True, default=None
    )
    locked_by: Mapped[str | None] = mapped_column(
        String(80), init=False, nullable=True, default=None
    )
    last_error: Mapped[str | None] = mapped_column(
        String(500), init=False, nullable=True, default=None
    )
