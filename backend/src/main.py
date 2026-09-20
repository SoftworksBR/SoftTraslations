from http import HTTPStatus

from fastapi import Depends, FastAPI

from src.models.employee_model import Employee
from src.routes import protected_router, public_router
from src.security import get_current_employee

app = FastAPI(title='API SoftTranslations')
app.include_router(public_router)
app.include_router(protected_router)


@app.get('/', status_code=HTTPStatus.OK)
async def status(
    current_employee: Employee = Depends(get_current_employee),
):
    return {'message': 'API is running'}
