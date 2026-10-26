from http import HTTPStatus

from fastapi import APIRouter, Depends, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.auth_controller import AuthController
from src.database import get_session
from src.models.employee_model import Employee
from src.repositories.employee_repository import EmployeeRepository
from src.schemas.auth_schema import TokenSchema
from src.schemas.employee_schema import EmployeePublicSchema
from src.security import get_current_employee, settings

router = APIRouter(
    prefix='/auth',
    tags=['Auth'],
)


@router.get('/me', response_model=EmployeePublicSchema)
async def get_authenticated_employee(
    current_employee: Employee = Depends(get_current_employee),
):
    return current_employee


@router.post('/', response_model=TokenSchema)
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
):
    employee_repository = EmployeeRepository()
    controller = AuthController(employee_repository)
    token = await controller.login(form_data, session)

    response.set_cookie(
        key=settings.ACCESS_TOKEN_COOKIE_NAME,
        value=token['access_token'],
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path='/',
    )
    return token


@router.post(
    '/logout',
    status_code=HTTPStatus.NO_CONTENT,
    response_class=Response,
)
async def logout():
    response = Response(status_code=HTTPStatus.NO_CONTENT)
    response.delete_cookie(
        key=settings.ACCESS_TOKEN_COOKIE_NAME,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path='/',
    )
    return response
