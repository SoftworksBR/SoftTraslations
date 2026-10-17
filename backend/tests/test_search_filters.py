import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

from sqlalchemy.dialects import postgresql

from src.enums.enums import Roles, Status, Translations
from src.repositories.employee_repository import EmployeeRepository
from src.repositories.project_repository import ProjectRepository
from src.repositories.request_repository import RequestRepository
from src.repositories.stage_repository import StageRepository
from src.schemas.employee_schema import EmployeeSearchFilters
from src.schemas.project_schema import ProjectSearchFilters
from src.schemas.request_schema import RequestSearchFilters
from src.schemas.stage_schema import StageSearchFilters


class _Result:
    @staticmethod
    def scalars():
        return _Result()

    @staticmethod
    def all():
        return []


def _sql(statement):
    compiled = statement.compile(dialect=postgresql.dialect())
    return str(compiled).lower()


def test_employee_search_filters_build_case_insensitive_query():
    session = SimpleNamespace(
        scalars=AsyncMock(return_value=_Result()),
    )

    asyncio.run(
        EmployeeRepository.get_employees(
            session,
            limit=10,
            offset=0,
            filters=EmployeeSearchFilters(
                username='ana',
                email='example.com',
                role=Roles.FREELANCER,
            ),
        )
    )

    query = _sql(session.scalars.await_args.args[0])
    assert 'employees.username ilike' in query
    assert 'employees.email ilike' in query
    assert 'employees.role =' in query


def test_request_search_filters_build_case_insensitive_query():
    session = SimpleNamespace(
        execute=AsyncMock(return_value=_Result()),
    )

    asyncio.run(
        RequestRepository(session).get_all(
            RequestSearchFilters(
                username='ana',
                email='example.com',
                phone='123',
                company='example',
                translate_from=Translations.PORTUGUESE,
                translate_to=Translations.ENGLISH,
            )
        )
    )

    query = _sql(session.execute.await_args.args[0])
    assert 'requests.username ilike' in query
    assert 'requests.email ilike' in query
    assert 'requests.phone ilike' in query
    assert 'requests.company ilike' in query
    assert 'requests.translate_from =' in query
    assert 'requests.translate_to =' in query


def test_project_search_filters_include_related_path_stages():
    session = SimpleNamespace(
        execute=AsyncMock(return_value=_Result()),
    )

    asyncio.run(
        ProjectRepository(session).get_all(
            ProjectSearchFilters(
                name='project',
                status=Status.READY,
                stage_name='review',
                freelancer_name='ana',
                creator_name='maria',
            )
        )
    )

    query = _sql(session.execute.await_args.args[0])
    assert 'projects.name ilike' in query
    assert 'projects.status =' in query
    assert 'stages.name ilike' in query
    assert 'employees.username ilike' in query
    assert 'projects.creator_id in' in query


def test_stage_search_filters_include_related_projects():
    session = SimpleNamespace(
        execute=AsyncMock(return_value=_Result()),
    )

    asyncio.run(
        StageRepository(session).get_all(
            freelancer_id=7,
            filters=StageSearchFilters(
                name='review',
                status=Status.READY,
                project_name='project',
                freelancer_name='ana',
            ),
        )
    )

    query = _sql(session.execute.await_args.args[0])
    assert 'stages.freelancer_id =' in query
    assert 'stages.name ilike' in query
    assert 'stages.status =' in query
    assert 'path_stages' in query
    assert 'path_projects' in query
    assert 'projects.name ilike' in query
    assert 'employees.username ilike' in query
