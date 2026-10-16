from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.preco_traducao_model import PrecoTraducao


class PrecoTraducaoRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, preco: PrecoTraducao) -> PrecoTraducao:
        self.session.add(preco)
        await self.session.commit()
        await self.session.refresh(preco)
        return preco

    async def get_by_id(
        self,
        preco_id: int,
    ) -> PrecoTraducao | None:
        return await self.session.scalar(
            select(PrecoTraducao).where(PrecoTraducao.id == preco_id)
        )

    async def get_all(self) -> list[PrecoTraducao]:
        result = await self.session.scalars(
            select(PrecoTraducao).order_by(
                PrecoTraducao.servico_id,
                PrecoTraducao.idioma_origem_id,
                PrecoTraducao.idioma_destino_id,
            )
        )
        return list(result.all())

    async def get_by_combination(
        self,
        servico_id: int,
        idioma_origem_id: int,
        idioma_destino_id: int,
        exclude_id: int | None = None,
    ) -> PrecoTraducao | None:
        query = select(PrecoTraducao).where(
            PrecoTraducao.servico_id == servico_id,
            PrecoTraducao.idioma_origem_id == idioma_origem_id,
            PrecoTraducao.idioma_destino_id == idioma_destino_id,
        )

        if exclude_id is not None:
            query = query.where(PrecoTraducao.id != exclude_id)

        return await self.session.scalar(query)

    async def update(self, preco: PrecoTraducao) -> PrecoTraducao:
        await self.session.commit()
        await self.session.refresh(preco)
        return preco