from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.auth_controller import AuthController
from src.database import get_session
from src.repositories.employee_repository import EmployeeRepository
from src.schemas.auth_schema import TokenSchema

router = APIRouter(
    prefix='/auth',
    tags=['Auth'],
)


@router.post('/', response_model=TokenSchema)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
):
    employee_repository = EmployeeRepository(session)
    controller = AuthController(employee_repository)

    return await controller.login(form_data)
