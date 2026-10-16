from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.idioma_model import Idioma


class IdiomaRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, idioma: Idioma) -> Idioma:
        self.session.add(idioma)
        await self.session.commit()
        await self.session.refresh(idioma)
        return idioma

    async def get_by_id(self, idioma_id: int) -> Idioma | None:
        return await self.session.scalar(
            select(Idioma).where(Idioma.id == idioma_id)
        )

    async def get_all(self) -> list[Idioma]:
        result = await self.session.scalars(
            select(Idioma).order_by(Idioma.nome)
        )
        return list(result.all())

    async def update(self, idioma: Idioma) -> Idioma:
        await self.session.commit()
        await self.session.refresh(idioma)
        return idioma