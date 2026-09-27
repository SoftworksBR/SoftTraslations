from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.stage_model import Stage


class StageRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, stage: Stage) -> Stage:

        self.session.add(stage)

        await self.session.commit()
        await self.session.refresh(stage)

        return stage

    async def assign_to_project(self, stage: Stage) -> Stage:
        await self.session.commit()
        await self.session.refresh(stage)

        return stage

    async def get_by_id(self, stage_id: int) -> Stage | None:

        result = await self.session.execute(
            select(Stage).where(Stage.id == stage_id)
        )

        return result.scalar_one_or_none()

    async def get_all(self, freelancer_id: int | None = None) -> list[Stage]:
        query = select(Stage)
        if freelancer_id is not None:
            query = query.where(Stage.freelancer_id == freelancer_id)

        result = await self.session.execute(query)

        return list(result.scalars().all())

    async def update(self, stage: Stage) -> Stage:

        await self.session.commit()
        await self.session.refresh(stage)

        return stage

    async def delete(self, stage: Stage) -> None:

        await self.session.delete(stage)

        await self.session.commit()
