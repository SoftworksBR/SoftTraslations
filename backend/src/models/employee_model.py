from datetime import datetime

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column

from src.enums.enums import EmployeeStatus, FreelancerType, Roles

from .base import table_registry


@table_registry.mapped_as_dataclass
class Employee:
    __tablename__ = 'employees'

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    username: Mapped[str] = mapped_column(nullable=False)
    email: Mapped[str] = mapped_column(unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    role: Mapped[Roles] = mapped_column(SQLEnum(Roles), nullable=False)
    status: Mapped[EmployeeStatus] = mapped_column(
        SQLEnum(
            EmployeeStatus,
            name='employee_status',
            values_callable=lambda enum: [member.value for member in enum],
        ),
        default=EmployeeStatus.AVAILABLE,
    )
    freelancer_type: Mapped[FreelancerType | None] = mapped_column(
        SQLEnum(
            FreelancerType,
            name='freelancer_type',
            values_callable=lambda enum: [member.value for member in enum],
        ),
        nullable=True,
        default=None,
    )
    created_at: Mapped[datetime] = mapped_column(
        init=False, server_default=func.now()
    )
