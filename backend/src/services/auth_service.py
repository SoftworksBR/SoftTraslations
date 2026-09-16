from fastapi import HTTPException
from http import HTTPStatus

from src.repositories.user_repository import UserRepository
from src.security import create_access_token, verify_password


class AuthService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def authenticate(
        self,
        email: str,
        password: str,
    ) -> dict:

        user = await self.user_repository.get_by_email(email)

        if not user or not verify_password(
            password,
            user.password,
        ):
            raise HTTPException(
                status_code=HTTPStatus.UNAUTHORIZED,
                detail="Incorrect username or password",
            )

        access_token = create_access_token(
            data={"sub": user.email}
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }