from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.employee_repository import EmployeeRepository
from src.services.auth_service import AuthService


class AuthController:
    def __init__(self, employee_repository: EmployeeRepository):
        self.auth_service = AuthService(employee_repository)

    async def login(
        self,
        form_data: OAuth2PasswordRequestForm,
        session: AsyncSession,
    ) -> dict:

        return await self.auth_service.authenticate(
            session=session,
            email=form_data.username,
            password=form_data.password,
        )
