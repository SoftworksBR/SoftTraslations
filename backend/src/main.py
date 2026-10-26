from contextlib import asynccontextmanager
from http import HTTPStatus

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.database import AsyncSessionLocal
from src.models.employee_model import Employee
from src.routes import protected_router, public_router
from src.security import get_current_employee
from src.services.initial_admin import initialize_initial_admin
from src.services.mongo_logging import (
    start_mongo_logging,
    stop_mongo_logging,
)
from src.services.outbox_worker import OutboxWorker
from src.settings import Settings

settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncSessionLocal() as session:
        await initialize_initial_admin(session, settings)

    listener = start_mongo_logging(
        settings.MONGODB_URI,
        settings.MONGODB_DATABASE,
        settings.MONGODB_TIMEOUT_MS,
    )
    worker = OutboxWorker(AsyncSessionLocal, settings)
    worker.start()
    try:
        yield
    finally:
        try:
            await worker.stop()
        finally:
            stop_mongo_logging(listener)


app = FastAPI(title='API SoftTranslations', lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in settings.CORS_ORIGINS.split(',')
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
app.include_router(public_router)
app.include_router(protected_router)


@app.get('/', status_code=HTTPStatus.OK)
async def status(
    current_employee: Employee = Depends(get_current_employee),
):
    return {'message': 'API is running'}
