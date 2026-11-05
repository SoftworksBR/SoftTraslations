import logging
import queue
import re
import sys
from datetime import UTC, datetime
from logging.handlers import QueueHandler, QueueListener

from pymongo import MongoClient
from pymongo.errors import PyMongoError

_SENSITIVE_VALUE = re.compile(
    r'(?i)(password|passwd|secret|token|authorization)([=:]\s*)[^\s,;&]+'
)


def _sanitize(value: str) -> str:
    return _SENSITIVE_VALUE.sub(r'\1\2[REDACTED]', value)[:4000]


class MongoDocumentHandler(logging.Handler):
    def __init__(self, uri: str, database: str, timeout_ms: int):
        super().__init__()
        self._uri = uri
        self._database = database
        self._timeout_ms = timeout_ms
        self._client = MongoClient(
            uri,
            serverSelectionTimeoutMS=timeout_ms,
            connectTimeoutMS=timeout_ms,
            appname='softtranslations-application-logs',
        )
        self._collection = self._client[database]['application_logs']
        self._failure_reported = False

    def emit(self, record: logging.LogRecord) -> None:
        document = {
            'timestamp': datetime.now(UTC),
            'level': record.levelname,
            'logger': record.name,
            'message': _sanitize(record.getMessage()),
            'request_id': getattr(record, 'request_id', None),
            'correlation_id': getattr(record, 'correlation_id', None),
            'exception_type': (
                record.exc_info[0].__name__ if record.exc_info else None
            ),
            'context': {},
        }
        try:
            self._collection.insert_one(document)
            self._failure_reported = False
        except PyMongoError as exc:
            if not self._failure_reported:
                sys.stderr.write(
                    'Mongo technical logging unavailable: '
                    f'{type(exc).__name__}.\n'
                )
                self._failure_reported = True

    def close(self) -> None:
        self._client.close()
        super().close()


def start_mongo_logging(
    uri: str,
    database: str,
    timeout_ms: int,
) -> QueueListener:
    log_queue: queue.Queue[logging.LogRecord] = queue.Queue(maxsize=5000)
    document_handler = MongoDocumentHandler(uri, database, timeout_ms)
    queue_handler = QueueHandler(log_queue)
    queue_handler.setLevel(logging.WARNING)
    root_logger = logging.getLogger()
    root_logger.addHandler(queue_handler)

    listener = QueueListener(
        log_queue,
        document_handler,
        respect_handler_level=True,
    )
    listener.start()
    return listener


def stop_mongo_logging(listener: QueueListener) -> None:
    listener.stop()
    for handler in logging.getLogger().handlers:
        if (
            isinstance(handler, QueueHandler)
            and handler.queue is listener.queue
        ):
            logging.getLogger().removeHandler(handler)
    for handler in listener.handlers:
        handler.close()
