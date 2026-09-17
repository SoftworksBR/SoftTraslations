from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.auth_controller import AuthController
from src.database import get_session
from src.repositories.user_repository import UserRepository
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
    user_repository = UserRepository(session)
    controller = AuthController(user_repository)

    return await controller.login(form_data)
