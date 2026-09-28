from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.request_model import Request


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
        username: str | None = None,
        email: str | None = None,
        phone: str | None = None,
        company: str | None = None,
        translate_from=None,
        translate_to=None,
    ) -> list[Request]:
        statement = select(Request)

        if username is not None:
            statement = statement.where(Request.username.ilike(f'%{username}%'))

        if email is not None:
            statement = statement.where(Request.email.ilike(f'%{email}%'))

        if phone is not None:
            statement = statement.where(Request.phone.ilike(f'%{phone}%'))

        if company is not None:
            statement = statement.where(Request.company.ilike(f'%{company}%'))

        if translate_from is not None:
            statement = statement.where(Request.translate_from == translate_from)

        if translate_to is not None:
            statement = statement.where(Request.translate_to == translate_to)

        result = await self.session.execute(statement)

        return list(result.scalars().all())

    async def update(self, request: Request) -> Request:

        await self.session.commit()
        await self.session.refresh(request)

        return request

    async def delete(self, request: Request) -> None:

        await self.session.delete(request)

        await self.session.commit()
