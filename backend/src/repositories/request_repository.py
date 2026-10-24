from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.file_model import RequestFile
from src.models.request_model import Request
from src.schemas.request_schema import RequestSearchFilters


class RequestRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, request: Request) -> Request:
        self.session.add(request)

        await self.session.commit()

        # Recarrega com os relacionamentos (serviço e idiomas) já unidos.
        return await self._reload(request.id)

    async def _reload(self, request_id: int) -> Request:
        result = await self.session.execute(
            select(Request)
            .where(Request.id == request_id)
            .execution_options(populate_existing=True)
        )

        return result.scalar_one()

    async def get_by_id(self, request_id: int) -> Request | None:
        result = await self.session.execute(
            select(Request).where(Request.id == request_id)
        )

        return result.unique().scalar_one_or_none()

    async def get_by_public_token(self, token: str) -> Request | None:
        result = await self.session.execute(
            select(Request).where(Request.public_token == token)
        )

        return result.unique().scalar_one_or_none()

    async def get_all(
        self,
        filters: RequestSearchFilters | None = None,
    ) -> list[Request]:
        statement = select(Request).order_by(Request.id.desc())

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
                    Request.company_name.ilike(f'%{filters.company}%')
                )

            if filters.source_language_id is not None:
                statement = statement.where(
                    Request.source_language_id == filters.source_language_id
                )

            if filters.target_language_id is not None:
                statement = statement.where(
                    Request.target_language_id == filters.target_language_id
                )

            if filters.service_id is not None:
                statement = statement.where(
                    Request.service_id == filters.service_id
                )

            if filters.status is not None:
                statement = statement.where(Request.status == filters.status)

        result = await self.session.execute(statement)

        return list(result.unique().scalars().all())

    async def update(self, request: Request) -> Request:
        await self.session.commit()

        return await self._reload(request.id)

    async def delete(self, request: Request) -> None:
        await self.session.execute(
            delete(RequestFile).where(RequestFile.request_id == request.id)
        )
        await self.session.delete(request)
        await self.session.commit()

    # ---- arquivos ----------------------------------------------------
    async def add_file(self, request_file: RequestFile) -> RequestFile:
        self.session.add(request_file)

        await self.session.commit()
        await self.session.refresh(request_file)

        return request_file

    async def list_files(self, request_id: int) -> list[RequestFile]:
        result = await self.session.execute(
            select(RequestFile)
            .where(RequestFile.request_id == request_id)
            .order_by(RequestFile.id)
        )

        return list(result.scalars().all())

    async def get_file(
        self, request_id: int, file_id: int
    ) -> RequestFile | None:
        result = await self.session.execute(
            select(RequestFile).where(
                RequestFile.request_id == request_id,
                RequestFile.id == file_id,
            )
        )

        return result.scalar_one_or_none()
