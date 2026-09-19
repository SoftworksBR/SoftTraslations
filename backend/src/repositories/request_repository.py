from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.request_model import Request


class RequestRepository:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        request: Request
    ) -> Request:

        self.session.add(request)

        await self.session.commit()
        await self.session.refresh(request)

        return request

    async def get_by_id(
        self,
        request_id: int
    ) -> Request | None:

        result = await self.session.execute(
            select(Request).where(
                Request.id == request_id
            )
        )

        return result.scalar_one_or_none()

    async def get_all(self) -> list[Request]:

        result = await self.session.execute(
            select(Request)
        )

        return list(result.scalars().all())

    async def update(
        self,
        request: Request
    ) -> Request:

        await self.session.commit()
        await self.session.refresh(request)

        return request

    async def delete(
        self,
        request: Request
    ) -> None:

        await self.session.delete(request)

        await self.session.commit()