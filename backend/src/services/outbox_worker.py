import asyncio
import logging
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from pymongo import AsyncMongoClient
from pymongo.errors import PyMongoError
from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import async_sessionmaker

from src.models.outbox_model import OutboxEvent
from src.settings import Settings

logger = logging.getLogger(__name__)


class OutboxWorker:
    def __init__(
        self,
        sessions: async_sessionmaker,
        settings: Settings,
    ):
        self._sessions = sessions
        self._settings = settings
        self._worker_id = str(uuid4())
        self._client = AsyncMongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=settings.MONGODB_TIMEOUT_MS,
            connectTimeoutMS=settings.MONGODB_TIMEOUT_MS,
            appname='softtranslations-outbox',
        )
        self._stop = asyncio.Event()
        self._task: asyncio.Task | None = None

    def start(self) -> None:
        self._task = asyncio.create_task(self.run(), name='outbox-worker')

    async def stop(self) -> None:
        self._stop.set()
        try:
            if self._task is not None:
                await self._task
        finally:
            await self._client.close()

    async def run(self) -> None:
        collection = self._client[self._settings.MONGODB_DATABASE][
            'audit_logs'
        ]
        await self._create_indexes(collection)

        while not self._stop.is_set():
            try:
                batch = await self._claim_batch()
            except SQLAlchemyError as exc:
                logger.error(
                    'Outbox batch claim failed (%s); retrying',
                    type(exc).__name__,
                )
                await self._wait_before_retry()
                continue

            if not batch:
                await self._wait_before_retry()
                continue

            for event in batch:
                if self._stop.is_set():
                    break
                try:
                    await self._publish(collection, event)
                except SQLAlchemyError as exc:
                    logger.error(
                        'Outbox event %s persistence failed (%s); '
                        'its lease will expire for retry',
                        event['event_id'],
                        type(exc).__name__,
                    )

    async def _wait_before_retry(self) -> None:
        try:
            await asyncio.wait_for(
                self._stop.wait(),
                timeout=self._settings.OUTBOX_POLL_INTERVAL_SECONDS,
            )
        except TimeoutError:
            pass

    @staticmethod
    async def _create_indexes(collection) -> None:
        try:
            await collection.create_index('event_id', unique=True)
            await collection.create_index([
                ('entity.type', 1),
                ('entity.id', 1),
                ('timestamp', -1),
            ])
            await collection.create_index([
                ('actor.employee_id', 1),
                ('timestamp', -1),
            ])
            await collection.create_index([('action', 1), ('timestamp', -1)])
            await collection.create_index('timestamp')
        except PyMongoError as exc:
            logger.warning(
                'Mongo audit index setup failed (%s); '
                'outbox delivery will retry',
                type(exc).__name__,
            )

    async def _claim_batch(self) -> list[dict]:
        now = datetime.now(UTC)
        async with self._sessions() as session:
            async with session.begin():
                result = await session.scalars(
                    select(OutboxEvent)
                    .where(
                        OutboxEvent.processed_at.is_(None),
                        OutboxEvent.next_attempt_at <= now,
                        or_(
                            OutboxEvent.locked_until.is_(None),
                            OutboxEvent.locked_until < now,
                        ),
                    )
                    .order_by(OutboxEvent.id)
                    .limit(self._settings.OUTBOX_BATCH_SIZE)
                    .with_for_update(skip_locked=True)
                )
                events = list(result)
                lease = now + timedelta(seconds=60)
                for event in events:
                    event.locked_by = self._worker_id
                    event.locked_until = lease
                return [
                    {
                        'id': event.id,
                        'event_id': str(event.event_id),
                        'event_type': event.event_type,
                        'aggregate_type': event.aggregate_type,
                        'aggregate_id': event.aggregate_id,
                        'payload': event.payload,
                        'created_at': event.created_at,
                        'attempts': event.attempts,
                    }
                    for event in events
                ]

    async def _publish(self, collection, event: dict) -> None:
        payload = event['payload']
        document = {
            'event_id': event['event_id'],
            'timestamp': event['created_at'],
            'actor': payload.get('actor'),
            'action': event['event_type'],
            'entity': {
                'type': event['aggregate_type'],
                'id': event['aggregate_id'],
            },
            'details': payload.get('details', {}),
            'request_id': payload.get('request_id'),
            'correlation_id': payload.get('correlation_id'),
            'source': payload.get('source', 'api'),
        }

        try:
            await collection.replace_one(
                {'event_id': event['event_id']},
                document,
                upsert=True,
            )
        except PyMongoError as exc:
            await self._reschedule(event, exc)
            return

        async with self._sessions() as session:
            async with session.begin():
                outbox_event = await session.scalar(
                    select(OutboxEvent)
                    .where(
                        OutboxEvent.id == event['id'],
                        OutboxEvent.locked_by == self._worker_id,
                        OutboxEvent.processed_at.is_(None),
                    )
                    .with_for_update()
                )
                if outbox_event is not None:
                    outbox_event.processed_at = datetime.now(UTC)
                    outbox_event.locked_by = None
                    outbox_event.locked_until = None
                    outbox_event.last_error = None

    async def _reschedule(self, event: dict, error: PyMongoError) -> None:
        now = datetime.now(UTC)
        attempts = event['attempts'] + 1
        delay_seconds = min(2 ** min(attempts, 10), 3600)
        async with self._sessions() as session:
            async with session.begin():
                outbox_event = await session.scalar(
                    select(OutboxEvent)
                    .where(
                        OutboxEvent.id == event['id'],
                        OutboxEvent.locked_by == self._worker_id,
                        OutboxEvent.processed_at.is_(None),
                    )
                    .with_for_update()
                )
                if outbox_event is None:
                    return
                outbox_event.attempts = attempts
                outbox_event.next_attempt_at = now + timedelta(
                    seconds=delay_seconds
                )
                outbox_event.last_error = type(error).__name__[:500]
                outbox_event.locked_by = None
                outbox_event.locked_until = None
        logger.warning(
            'Outbox event %s could not be published (%s); retry scheduled',
            event['event_id'],
            type(error).__name__,
        )
