from fastapi.security import OAuth2PasswordRequestForm

from src.repositories.user_repository import UserRepository
from src.services.auth_service import AuthService


class AuthController:
    def __init__(self, user_repository: UserRepository):
        self.auth_service = AuthService(user_repository)

    async def login(
        self,
        form_data: OAuth2PasswordRequestForm,
    ) -> dict:

        return await self.auth_service.authenticate(
            email=form_data.username,
            password=form_data.password,
        )