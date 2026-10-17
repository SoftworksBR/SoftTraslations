
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.language_model import Language


class LanguageRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, language: Language) -> Language:
        self.session.add(language)
        await self.session.commit()
        await self.session.refresh(language)
        return language

    async def get_by_id(self, language_id: int) -> Language | None:
        return await self.session.scalar(
            select(Language).where(Language.id == language_id)
        )

    async def get_all(self) -> list[Language]:
        result = await self.session.scalars(
            select(Language).order_by(Language.name)
        )
        return list(result.all())

    async def update(self, language: Language) -> Language:
        await self.session.commit()
        await self.session.refresh(language)
        return language
