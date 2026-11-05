from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import Roles
from src.models.employee_model import Employee
from src.repositories.employee_repository import EmployeeRepository
from src.schemas.employee_schema import EmployeeSchema
from src.services.employee_service import EmployeeService
from src.settings import Settings

INITIAL_ADMIN_LOCK_ID = 0x53575452


async def initialize_initial_admin(
    session: AsyncSession,
    settings: Settings,
) -> Employee | None:
    await session.execute(
        select(func.pg_advisory_xact_lock(INITIAL_ADMIN_LOCK_ID))
    )
    existing_employees = await EmployeeRepository.get_employees(
        session,
        limit=1,
        offset=0,
    )
    if existing_employees:
        return None

    username = settings.INITIAL_ADMIN_USERNAME.strip()
    email = settings.INITIAL_ADMIN_EMAIL.strip()
    password = settings.INITIAL_ADMIN_PASSWORD
    if not username or not email or not password:
        raise RuntimeError(
            'Set INITIAL_ADMIN_USERNAME, INITIAL_ADMIN_EMAIL, and '
            'INITIAL_ADMIN_PASSWORD in .env to initialize an empty database'
        )

    employee = EmployeeSchema(
        username=username,
        email=email,
        role=Roles.ADMIN,
        password=password,
    )
    return await EmployeeService.create_initial_admin(session, employee)
