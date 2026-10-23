from sqlalchemy import create_engine, event, func, select
from sqlalchemy.orm import Session

from src.enums.enums import EmployeeStatus, Roles
from src.models.base import table_registry
from src.models.employee_model import Employee
from src.models.freelancer_profile_model import (
    FreelancerProfile,
    freelancer_profile_native_languages,
    freelancer_profile_services,
    freelancer_profile_source_languages,
    freelancer_profile_target_languages,
)
from src.models.language_model import Language
from src.models.service_model import Service

ASSOCIATION_TABLES = (
    freelancer_profile_source_languages,
    freelancer_profile_target_languages,
    freelancer_profile_native_languages,
    freelancer_profile_services,
)


def _engine_with_foreign_keys():
    # SQLite em memória só aplica as FKs (e o ON DELETE) com o PRAGMA.
    engine = create_engine('sqlite://')

    @event.listens_for(engine, 'connect')
    def enable_foreign_keys(connection, _):
        connection.execute('PRAGMA foreign_keys=ON')

    tables = [
        Employee.__table__,
        Language.__table__,
        Service.__table__,
        FreelancerProfile.__table__,
        *ASSOCIATION_TABLES,
    ]
    table_registry.metadata.create_all(engine, tables=tables)

    return engine


def _count(session, table):
    return session.scalar(select(func.count()).select_from(table))


def test_deleting_freelancer_removes_profile_and_associations():
    engine = _engine_with_foreign_keys()

    with Session(engine) as session:
        language = Language(name='Português', code='pt')
        service = Service(name='Tradução')
        employee = Employee(
            first_name='Ana',
            last_name='Silva',
            email='ana@example.com',
            password='hash',
            role=Roles.FREELANCER,
            status=EmployeeStatus.UNDER_REVIEW,
        )
        session.add_all([language, service, employee])
        session.flush()
        session.add(
            FreelancerProfile(
                employee_id=employee.id,
                salutation='Sra.',
                academic_title='Bacharel',
                job_function='Tradutora',
                source_languages=[language],
                target_languages=[language],
                native_languages=[language],
                services=[service],
            )
        )
        session.commit()
        assert all(_count(session, table) == 1 for table in ASSOCIATION_TABLES)

        session.delete(employee)
        session.commit()

        assert _count(session, Employee) == 0
        assert _count(session, FreelancerProfile) == 0
        assert all(_count(session, table) == 0 for table in ASSOCIATION_TABLES)
        # Idiomas e serviços são cadastros próprios e continuam existindo.
        assert _count(session, Language) == 1
        assert _count(session, Service) == 1
