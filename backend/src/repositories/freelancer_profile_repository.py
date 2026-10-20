from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.freelancer_profile_model import FreelancerProfile


class FreelancerProfileRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_employee_id(
        self, employee_id: int
    ) -> FreelancerProfile | None:
        return await self.session.scalar(
            select(FreelancerProfile).where(
                FreelancerProfile.employee_id == employee_id
            )
        )

    async def create(self, profile: FreelancerProfile) -> FreelancerProfile:
        self.session.add(profile)
        await self.session.commit()
        await self.session.refresh(profile)
        return profile
