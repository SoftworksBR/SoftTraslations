from datetime import date, datetime

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column

from src.enums.enums import EmployeeStatus, Roles

from .base import table_registry


@table_registry.mapped_as_dataclass
class Employee:
    __tablename__ = 'employees'

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    first_name: Mapped[str] = mapped_column(nullable=False)
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
    last_name: Mapped[str] = mapped_column(nullable=False, default='')
    birth_date: Mapped[date | None] = mapped_column(
        nullable=True, default=None
    )
    phone: Mapped[str | None] = mapped_column(nullable=True, default=None)
    photo_path: Mapped[str | None] = mapped_column(nullable=True, default=None)
    invite_token: Mapped[str | None] = mapped_column(
        unique=True, nullable=True, default=None
    )
    invite_token_expires_at: Mapped[datetime | None] = mapped_column(
        nullable=True, default=None
    )
    created_at: Mapped[datetime] = mapped_column(
        init=False, server_default=func.now()
    )
