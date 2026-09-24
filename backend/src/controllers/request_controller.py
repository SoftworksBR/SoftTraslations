from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.request_schema import RequestCreate, RequestUpdate
from src.services.request_service import RequestService


class RequestController:
    @staticmethod
    async def create(data: RequestCreate, session: AsyncSession):

        service = RequestService(session)

        return await service.create(data)

    @staticmethod
    async def get_by_id(request_id: int, session: AsyncSession):

        service = RequestService(session)

        return await service.get_by_id(request_id)

    @staticmethod
    async def get_all(
        session: AsyncSession,
        username: str | None = None,
        email: str | None = None,
        phone: str | None = None,
        company: str | None = None,
        translate_from=None,
        translate_to=None,
    ):

        service = RequestService(session)

        return await service.get_all(
            username=username,
            email=email,
            phone=phone,
            company=company,
            translate_from=translate_from,
            translate_to=translate_to,
        )

    @staticmethod
    async def update(
        request_id: int, data: RequestUpdate, session: AsyncSession
    ):

        service = RequestService(session)

        return await service.update(request_id, data)

    @staticmethod
    async def delete(request_id: int, session: AsyncSession):

        service = RequestService(session)

        await service.delete(request_id)
