from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.path_model import Path


class PathRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, path: Path) -> Path:
        self.session.add(path)
        await self.session.commit()

        return await self.get_by_id(path.id)

    async def get_by_id(self, path_id: int) -> Path | None:
        result = await self.session.execute(
            select(Path)
            .options(selectinload(Path.stages))
            .where(Path.id == path_id)
        )

        return result.scalar_one_or_none()

    async def get_all(self) -> list[Path]:
        result = await self.session.execute(
            select(Path).options(selectinload(Path.stages))
        )

        return list(result.scalars().all())

    async def delete(self, path: Path) -> None:
        await self.session.delete(path)
        await self.session.commit()
