import asyncio
import re
from types import SimpleNamespace
from unittest.mock import AsyncMock

from sqlalchemy.dialects import postgresql

from src.enums.enums import RequestStatus, Roles, StageStatus, Status
from src.repositories.employee_repository import EmployeeRepository
from src.repositories.project_repository import ProjectRepository
from src.repositories.quote_repository import QuoteRepository
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

    @staticmethod
    def unique():
        return _Result()


def _sql(statement):
    compiled = statement.compile(dialect=postgresql.dialect())
    return str(compiled).lower()


def test_quote_lock_excludes_nullable_outer_joins():
    result = SimpleNamespace(
        unique=lambda: SimpleNamespace(scalar_one_or_none=lambda: None)
    )
    session = SimpleNamespace(execute=AsyncMock(return_value=result))

    asyncio.run(QuoteRepository(session).get_by_id_for_update(1))

    query = _sql(session.execute.await_args.args[0])
    assert 'left outer join' in query
    assert query.endswith('for update of quotes')


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
                source_language_id=1,
                target_language_id=2,
                service_id=3,
                status=RequestStatus.PENDING,
            )
        )
    )

    query = _sql(session.execute.await_args.args[0])
    assert 'requests.username ilike' in query
    assert 'requests.email ilike' in query
    assert 'requests.phone ilike' in query
    assert 'requests.company_name ilike' in query
    assert 'requests.source_language_id =' in query
    assert 'request_target_languages' in query
    assert 'languages.id =' in query
    assert 'requests.service_id =' in query
    assert 'requests.status =' in query


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
    assert 'stage_templates.name ilike' in query
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
                status=StageStatus.READY,
                project_name='project',
                freelancer_name='ana',
            ),
        )
    )

    query = _sql(session.execute.await_args.args[0])
    assert 'project_stages.freelancer_id =' in query
    assert 'stage_templates.name ilike' in query
    assert 'project_stages.status =' in query
    assert 'path_stages' in query
    assert 'project_paths' in query
    assert 'projects.name ilike' in query
    assert 'employees.username ilike' in query


def _locked_statement(call):
    result = SimpleNamespace(
        unique=lambda: SimpleNamespace(scalar_one_or_none=lambda: None)
    )
    session = SimpleNamespace(execute=AsyncMock(return_value=result))
    asyncio.run(call(session))
    return _sql(session.execute.await_args.args[0])


def test_quote_lock_by_request_locks_only_quotes():
    query = _locked_statement(
        lambda session: QuoteRepository(session).get_by_request_id_for_update(
            3
        )
    )

    assert 'where quotes.request_id =' in query
    assert query.endswith('for update of quotes')


def test_request_lock_locks_request_row():
    query = _locked_statement(
        lambda session: RequestRepository(session).get_by_id_for_update(3)
    )

    assert 'where requests.id =' in query
    assert 'for update' in query
    assert query.endswith('for update of requests')


def _request_for_stage_statement(stage_id, found=None):
    session = SimpleNamespace(scalar=AsyncMock(return_value=found))
    result = asyncio.run(
        StageRepository(session).get_request_for_stage(stage_id)
    )
    return result, session.scalar.await_args.args[0]


def test_request_for_stage_joins_stage_to_request_through_quote():
    _, statement = _request_for_stage_statement(42)

    query = ' '.join(_sql(statement).split())
    assert (
        'from requests '
        'join quotes on quotes.request_id = requests.id '
        'join projects on projects.quote_id = quotes.id '
        'join project_paths on project_paths.project_id = projects.id '
        'join project_stages '
        'on project_stages.project_path_id = project_paths.id'
    ) in query


def test_request_for_stage_filters_by_given_stage_id():
    _, statement = _request_for_stage_statement(42)

    compiled = statement.compile(dialect=postgresql.dialect())
    match = re.search(
        r'where project_stages\.id = %\((\w+)\)s', str(compiled).lower()
    )
    assert match is not None
    assert compiled.params[match.group(1)] == 42  # noqa: PLR2004


def test_request_for_stage_returns_none_without_request():
    result, _ = _request_for_stage_statement(42, found=None)

    assert result is None


def test_request_for_stage_returns_found_request_unchanged():
    request = SimpleNamespace(id=7, source_language_id=1)

    result, _ = _request_for_stage_statement(42, found=request)

    assert result is request
