
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.translation_price_model import TranslationPrice


class TranslationPriceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        price: TranslationPrice,
    ) -> TranslationPrice:
        self.session.add(price)
        await self.session.commit()
        await self.session.refresh(price)
        return price

    async def get_by_id(
        self,
        price_id: int,
    ) -> TranslationPrice | None:
        return await self.session.scalar(
            select(TranslationPrice).where(TranslationPrice.id == price_id)
        )

    async def get_all(self) -> list[TranslationPrice]:
        result = await self.session.scalars(
            select(TranslationPrice).order_by(
                TranslationPrice.service_id,
                TranslationPrice.source_language_id,
                TranslationPrice.target_language_id,
            )
        )
        return list(result.all())

    async def get_by_combination(
        self,
        service_id: int,
        source_language_id: int,
        target_language_id: int,
        exclude_id: int | None = None,
    ) -> TranslationPrice | None:
        query = select(TranslationPrice).where(
            TranslationPrice.service_id == service_id,
            TranslationPrice.source_language_id == source_language_id,
            TranslationPrice.target_language_id == target_language_id,
        )

        if exclude_id is not None:
            query = query.where(TranslationPrice.id != exclude_id)

        return await self.session.scalar(query)

    async def update(self, price: TranslationPrice) -> TranslationPrice:
        await self.session.commit()
        await self.session.refresh(price)
        return price
