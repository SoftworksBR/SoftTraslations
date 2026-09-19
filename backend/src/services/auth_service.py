from http import HTTPStatus

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.employee_repository import EmployeeRepository
from src.security import create_access_token, verify_password


class AuthService:
    def __init__(self, employee_repository: EmployeeRepository):
        self.employee_repository = employee_repository

    async def authenticate(
        self,
        session: AsyncSession,
        email: str,
        password: str,
    ) -> dict:

        employee = await self.employee_repository.get_by_email_or_username(
            session,
            email=email,
            username=email,
        )

        if not employee or not verify_password(
            password,
            employee.password,
        ):
            raise HTTPException(
                status_code=HTTPStatus.UNAUTHORIZED,
                detail='Incorrect username or password',
            )

        access_token = create_access_token(data={'sub': employee.email})

        return {
            'access_token': access_token,
            'token_type': 'bearer',
        }
