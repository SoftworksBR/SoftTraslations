from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.request_schema import (
    RequestCreate,
    RequestPublicUpdate,
    RequestSearchFilters,
    RequestUpdate,
)
from src.services.request_service import RequestService


class RequestController:
    @staticmethod
    async def get_options(session: AsyncSession):
        return await RequestService(session).get_options()

    @staticmethod
    async def create(data: RequestCreate, session: AsyncSession):
        return await RequestService(session).create(data)

    @staticmethod
    async def get_public(token: str, session: AsyncSession):
        return await RequestService(session).get_public(token)

    @staticmethod
    async def update_public(
        token: str, data: RequestPublicUpdate, session: AsyncSession
    ):
        return await RequestService(session).update_public(token, data)

    @staticmethod
    async def delete_public(token: str, session: AsyncSession):
        await RequestService(session).delete_public(token)

    @staticmethod
    async def add_file_public(
        token: str, upload: UploadFile, session: AsyncSession
    ):
        return await RequestService(session).add_file_public(token, upload)

    @staticmethod
    async def get_all(
        session: AsyncSession,
        current_employee: Employee,
        filters: RequestSearchFilters,
    ):
        return await RequestService(session).get_all(current_employee, filters)

    @staticmethod
    async def update(
        request_id: int,
        data: RequestUpdate,
        session: AsyncSession,
        current_employee: Employee,
    ):
        return await RequestService(session).update(
            request_id, data, current_employee
        )

    @staticmethod
    async def delete(
        request_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ):
        await RequestService(session).delete(request_id, current_employee)

    @staticmethod
    async def list_files(
        request_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ):
        return await RequestService(session).list_files(
            request_id, current_employee
        )

    @staticmethod
    async def get_file(
        request_id: int,
        file_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ):
        return await RequestService(session).get_file(
            request_id, file_id, current_employee
        )
