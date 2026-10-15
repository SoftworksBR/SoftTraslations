from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.request_model import Request
from src.schemas.request_schema import RequestSearchFilters


class RequestRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, request: Request) -> Request:

        self.session.add(request)

        await self.session.commit()
        await self.session.refresh(request)

        return request

    async def get_by_id(self, request_id: int) -> Request | None:

        result = await self.session.execute(
            select(Request).where(Request.id == request_id)
        )

        return result.scalar_one_or_none()

    async def get_all(
        self,
        filters: RequestSearchFilters | None = None,
    ) -> list[Request]:

        statement = select(Request)

        if filters is not None:
            if filters.username is not None:
                statement = statement.where(
                    Request.username.ilike(f'%{filters.username}%')
                )

            if filters.email is not None:
                statement = statement.where(
                    Request.email.ilike(f'%{filters.email}%')
                )

            if filters.phone is not None:
                statement = statement.where(
                    Request.phone.ilike(f'%{filters.phone}%')
                )

            if filters.company is not None:
                statement = statement.where(
                    Request.company.ilike(f'%{filters.company}%')
                )

            if filters.translate_from is not None:
                statement = statement.where(
                    Request.translate_from == filters.translate_from
                )

            if filters.translate_to is not None:
                statement = statement.where(
                    Request.translate_to == filters.translate_to
                )

        result = await self.session.execute(statement)

        return list(result.scalars().all())

    async def update(self, request: Request) -> Request:

        await self.session.commit()
        await self.session.refresh(request)

        return request

    async def delete(self, request: Request) -> None:

        await self.session.delete(request)

        await self.session.commit()
