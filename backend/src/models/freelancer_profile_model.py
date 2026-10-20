from typing import TYPE_CHECKING

from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import table_registry

if TYPE_CHECKING:
    from src.models.language_model import Language
    from src.models.service_model import Service


freelancer_profile_source_languages = Table(
    'freelancer_profile_source_languages',
    table_registry.metadata,
    Column(
        'freelancer_profile_id',
        ForeignKey('freelancer_profiles.id'),
        primary_key=True,
    ),
    Column('language_id', ForeignKey('languages.id'), primary_key=True),
)

freelancer_profile_target_languages = Table(
    'freelancer_profile_target_languages',
    table_registry.metadata,
    Column(
        'freelancer_profile_id',
        ForeignKey('freelancer_profiles.id'),
        primary_key=True,
    ),
    Column('language_id', ForeignKey('languages.id'), primary_key=True),
)

freelancer_profile_native_languages = Table(
    'freelancer_profile_native_languages',
    table_registry.metadata,
    Column(
        'freelancer_profile_id',
        ForeignKey('freelancer_profiles.id'),
        primary_key=True,
    ),
    Column('language_id', ForeignKey('languages.id'), primary_key=True),
)

freelancer_profile_services = Table(
    'freelancer_profile_services',
    table_registry.metadata,
    Column(
        'freelancer_profile_id',
        ForeignKey('freelancer_profiles.id'),
        primary_key=True,
    ),
    Column('service_id', ForeignKey('services.id'), primary_key=True),
)


@table_registry.mapped_as_dataclass
class FreelancerProfile:
    __tablename__ = 'freelancer_profiles'

    id: Mapped[int] = mapped_column(
        init=False, primary_key=True, autoincrement=True
    )
    employee_id: Mapped[int] = mapped_column(
        ForeignKey('employees.id'), unique=True, nullable=False
    )
    salutation: Mapped[str] = mapped_column(nullable=False)
    academic_title: Mapped[str] = mapped_column(nullable=False)
    job_function: Mapped[str] = mapped_column(nullable=False)
    timezone: Mapped[str] = mapped_column(
        nullable=False, default='America/Sao_Paulo'
    )

    source_languages: Mapped[list['Language']] = relationship(
        secondary=freelancer_profile_source_languages,
        default_factory=list,
    )
    target_languages: Mapped[list['Language']] = relationship(
        secondary=freelancer_profile_target_languages,
        default_factory=list,
    )
    native_languages: Mapped[list['Language']] = relationship(
        secondary=freelancer_profile_native_languages,
        default_factory=list,
    )
    services: Mapped[list['Service']] = relationship(
        secondary=freelancer_profile_services,
        default_factory=list,
    )
