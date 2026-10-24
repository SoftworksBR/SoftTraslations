from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, func
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.enums.enums import AccountStatus, EmployeeStatus, Roles

from .base import table_registry

if TYPE_CHECKING:
    from src.models.project_model import Project
    from src.models.quote_model import Quote
    from src.models.request_model import Request
    from src.models.stage_model import ProjectStage


@table_registry.mapped_as_dataclass
class Employee:
    __tablename__ = 'employees'

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    username: Mapped[str] = mapped_column(nullable=False)
    email: Mapped[str] = mapped_column(unique=True, nullable=False)
    password: Mapped[str] = mapped_column('password_hash', nullable=False)
    role: Mapped[Roles] = mapped_column(
        SQLEnum(
            Roles,
            name='employee_role',
            values_callable=lambda enum: [member.value for member in enum],
        ),
        nullable=False,
    )
    first_name: Mapped[str | None] = mapped_column(nullable=True, default=None)
    last_name: Mapped[str | None] = mapped_column(nullable=True, default=None)
    birth_date: Mapped[date | None] = mapped_column(
        nullable=True, default=None
    )
    phone: Mapped[str | None] = mapped_column(nullable=True, default=None)
    account_status: Mapped[AccountStatus] = mapped_column(
        SQLEnum(
            AccountStatus,
            name='account_status',
            values_callable=lambda enum: [member.value for member in enum],
        ),
        default=AccountStatus.ACTIVE,
        nullable=False,
    )
    status: Mapped[EmployeeStatus] = mapped_column(
        SQLEnum(
            EmployeeStatus,
            name='employee_status',
            values_callable=lambda enum: [member.value for member in enum],
        ),
        default=EmployeeStatus.AVAILABLE,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), init=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        init=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    assigned_requests: Mapped[list['Request']] = relationship(
        back_populates='employee',
        init=False,
        foreign_keys='Request.employee_id',
    )
    quotes_created: Mapped[list['Quote']] = relationship(
        back_populates='created_by',
        init=False,
        foreign_keys='Quote.created_by_id',
    )
    quotes_approved: Mapped[list['Quote']] = relationship(
        back_populates='approved_by',
        init=False,
        foreign_keys='Quote.approved_by_id',
    )
    projects_created: Mapped[list['Project']] = relationship(
        back_populates='creator',
        init=False,
        foreign_keys='Project.creator_id',
    )
    assigned_project_stages: Mapped[list['ProjectStage']] = relationship(
        back_populates='freelancer',
        init=False,
        foreign_keys='ProjectStage.freelancer_id',
    )
    freelancer_profile: Mapped['FreelancerProfile | None'] = relationship(
        back_populates='employee',
        init=False,
        uselist=False,
        cascade='all, delete-orphan',
        lazy='selectin',
    )

    @property
    def profile_completed(self) -> bool:
        return bool(
            self.freelancer_profile
            and self.freelancer_profile.profile_completed
        )


@table_registry.mapped_as_dataclass
class FreelancerProfile:
    __tablename__ = 'freelancer_profiles'
    __table_args__ = (
        CheckConstraint(
            'hourly_rate IS NULL OR hourly_rate >= 0',
            name='ck_freelancer_profiles_nonnegative_rate',
        ),
    )

    employee_id: Mapped[int] = mapped_column(
        ForeignKey('employees.id', ondelete='CASCADE'),
        primary_key=True,
        init=False,
    )
    specialization: Mapped[str | None] = mapped_column(
        nullable=True, default=None
    )
    hourly_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True, default=None
    )
    bio: Mapped[str | None] = mapped_column(nullable=True, default=None)
    is_available: Mapped[bool] = mapped_column(default=True, nullable=False)
    profile_completed: Mapped[bool] = mapped_column(
        default=False, nullable=False
    )
    employee: Mapped[Employee] = relationship(
        back_populates='freelancer_profile', init=False
    )
