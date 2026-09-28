from http import HTTPStatus

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.auth_controller import AuthController
from src.controllers.employee_controller import create_employee
from src.database import get_session
from src.enums.enums import Roles
from src.repositories.employee_repository import EmployeeRepository
from src.schemas.auth_schema import TokenSchema
from src.schemas.employee_schema import EmployeePublicSchema, EmployeeSchema

router = APIRouter(
    prefix='/auth',
    tags=['Auth'],
)


@router.post('/', response_model=TokenSchema)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
):
    employee_repository = EmployeeRepository()
    controller = AuthController(employee_repository)

    return await controller.login(form_data, session)


@router.post(
    '/register-admin',
    response_model=EmployeePublicSchema,
    status_code=HTTPStatus.CREATED,
)
async def register_temporary_admin(
    session: AsyncSession = Depends(get_session),
):
    return await create_employee(
        EmployeeSchema(
            username='admin',
            email='admin@admin.com',
            role=Roles.ADMIN,
            password='admin123',
        ),
        session,
    )
