from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import QuoteStatus
from src.models.project_model import Project
from src.models.quote_model import Quote
from src.models.request_model import Request
from src.schemas.quote_schema import QuoteSearchFilters


class QuoteRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, quote: Quote) -> Quote:
        self.session.add(quote)

        await self.session.commit()

        return await self._reload(quote.id)

    async def _reload(self, quote_id: int) -> Quote:
        result = await self.session.execute(
            select(Quote)
            .where(Quote.id == quote_id)
            .execution_options(populate_existing=True)
        )

        return result.unique().scalar_one()

    async def get_by_id(self, quote_id: int) -> Quote | None:
        result = await self.session.execute(
            select(Quote).where(Quote.id == quote_id)
        )

        return result.unique().scalar_one_or_none()

    async def get_by_request_id(self, request_id: int) -> Quote | None:
        result = await self.session.execute(
            select(Quote).where(Quote.request_id == request_id)
        )

        return result.unique().scalar_one_or_none()

    async def get_all(
        self,
        filters: QuoteSearchFilters | None = None,
    ) -> list[Quote]:
        statement = select(Quote).order_by(Quote.id.desc())

        if filters is not None:
            if filters.status is not None:
                statement = statement.where(Quote.status == filters.status)

            if filters.request_id is not None:
                statement = statement.where(
                    Quote.request_id == filters.request_id
                )

            if filters.client_name is not None:
                statement = statement.where(
                    Quote.request_id.in_(
                        select(Request.id).where(
                            Request.username.ilike(f'%{filters.client_name}%')
                        )
                    )
                )

            if filters.available_for_project:
                statement = statement.where(
                    Quote.status == QuoteStatus.APPROVED,
                    Quote.id.not_in(
                        select(Project.quote_id).where(
                            Project.quote_id.is_not(None)
                        )
                    ),
                )

        result = await self.session.execute(statement)

        return list(result.unique().scalars().all())

    async def update(self, quote: Quote) -> Quote:
        await self.session.commit()

        return await self._reload(quote.id)

    async def delete(self, quote: Quote) -> None:
        await self.session.delete(quote)
        await self.session.commit()
