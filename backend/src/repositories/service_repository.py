
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.service_model import Service


class ServiceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, service: Service) -> Service:
        self.session.add(service)
        await self.session.commit()
        await self.session.refresh(service)
        return service

    async def get_by_id(self, service_id: int) -> Service | None:
        return await self.session.scalar(
            select(Service).where(Service.id == service_id)
        )

    async def get_all(self) -> list[Service]:
        result = await self.session.scalars(
            select(Service).order_by(Service.name)
        )
        return list(result.all())

    async def update(self, service: Service) -> Service:
        await self.session.commit()
        await self.session.refresh(service)
        return service
