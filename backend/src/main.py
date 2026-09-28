from http import HTTPStatus

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.models.employee_model import Employee
from src.routes import protected_router, public_router
from src.security import get_current_employee
from src.settings import Settings

app = FastAPI(title='API SoftTranslations')
settings = Settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in settings.CORS_ORIGINS.split(',')
        if origin.strip()
    ],
    allow_credentials=False,
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
