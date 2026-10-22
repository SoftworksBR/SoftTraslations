from sqlalchemy.ext.asyncio import AsyncSession

from src.models.outbox_model import OutboxEvent


def enqueue_event(
    session: AsyncSession,
    *,
    event_type: str,
    aggregate_type: str,
    aggregate_id: int,
    payload: dict,
) -> None:
    session.add(
        OutboxEvent(
            event_type=event_type,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            payload=payload,
        )
    )
