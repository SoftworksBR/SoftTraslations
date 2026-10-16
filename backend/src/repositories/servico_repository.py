from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.servico_model import Servico


class ServicoRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, servico: Servico) -> Servico:
        self.session.add(servico)
        await self.session.commit()
        await self.session.refresh(servico)
        return servico

    async def get_by_id(self, servico_id: int) -> Servico | None:
        return await self.session.scalar(
            select(Servico).where(Servico.id == servico_id)
        )

    async def get_all(self) -> list[Servico]:
        result = await self.session.scalars(
            select(Servico).order_by(Servico.nome)
        )
        return list(result.all())

    async def update(self, servico: Servico) -> Servico:
        await self.session.commit()
        await self.session.refresh(servico)
        return servico