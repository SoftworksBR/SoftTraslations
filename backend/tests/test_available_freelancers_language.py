import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from src.enums.enums import (
    AccountStatus,
    EmployeeStatus,
    LanguageMatch,
    Roles,
)
from src.repositories.stage_repository import StageRepository
from src.schemas.employee_schema import EmployeePublicSchema
from src.services.stage_service import StageService

PORTUGUESE, ENGLISH, SPANISH, GERMAN = 1, 2, 3, 4
classify = StageService._classify_language_match


def freelancer(employee_id, source=(), target=()):
    return SimpleNamespace(
        id=employee_id,
        username=f'freelancer{employee_id}',
        email=f'freelancer{employee_id}@example.com',
        role=Roles.FREELANCER,
        status=EmployeeStatus.AVAILABLE,
        account_status=AccountStatus.ACTIVE,
        profile_completed=True,
        source_language_ids=list(source),
        target_language_ids=list(target),
    )


COMPATIBLE = freelancer(1, [PORTUGUESE], [SPANISH])
OTHER_COMPATIBLE = freelancer(2, [PORTUGUESE], [ENGLISH])
UNDECLARED = freelancer(3)
INCOMPATIBLE = freelancer(4, [GERMAN], [ENGLISH])
REQUEST = SimpleNamespace(
    source_language_id=PORTUGUESE, target_language_ids=[ENGLISH, SPANISH]
)


def available(
    monkeypatch,
    employees,
    request=REQUEST,
    include_all=False,
    declined=(),
):
    service = StageService(
        SimpleNamespace(scalars=AsyncMock(return_value=employees))
    )
    monkeypatch.setattr(service, 'get_by_id', AsyncMock())
    monkeypatch.setattr(
        service,
        '_get_declined_freelancer_ids',
        AsyncMock(return_value=set(declined)),
    )
    monkeypatch.setattr(
        StageRepository,
        'get_request_for_stage',
        AsyncMock(return_value=request),
    )
    return asyncio.run(
        service.get_available_freelancers(
            10, SimpleNamespace(role=Roles.PROJETOS), include_all
        )
    )


def summary(result):
    return [(item.id, item.language_match) for item in result]


def test_compatible_requires_source_and_one_target():
    assert (
        classify(PORTUGUESE, [ENGLISH], [PORTUGUESE], [ENGLISH])
        == LanguageMatch.COMPATIBLE
    )


def test_source_mismatch_is_incompatible():
    assert (
        classify(PORTUGUESE, [ENGLISH], [GERMAN], [ENGLISH])
        == LanguageMatch.INCOMPATIBLE
    )


def test_target_mismatch_is_incompatible():
    assert (
        classify(PORTUGUESE, [ENGLISH], [PORTUGUESE], [GERMAN])
        == LanguageMatch.INCOMPATIBLE
    )


def test_one_common_target_is_enough_for_many_request_targets():
    assert (
        classify(PORTUGUESE, [ENGLISH, SPANISH], [PORTUGUESE], [SPANISH])
        == LanguageMatch.COMPATIBLE
    )


@pytest.mark.parametrize(
    ('source', 'target'), [([PORTUGUESE], []), ([], [ENGLISH])]
)
def test_one_filled_side_follows_normal_rule(source, target):
    assert (
        classify(PORTUGUESE, [ENGLISH], source, target)
        == LanguageMatch.INCOMPATIBLE
    )


def test_undeclared_comes_after_compatible(monkeypatch):
    result = available(monkeypatch, [UNDECLARED, COMPATIBLE])

    assert summary(result) == [
        (COMPATIBLE.id, LanguageMatch.COMPATIBLE),
        (UNDECLARED.id, LanguageMatch.UNDECLARED),
    ]


def test_incompatible_is_hidden_by_default(monkeypatch):
    result = available(monkeypatch, [INCOMPATIBLE, COMPATIBLE])

    assert summary(result) == [(COMPATIBLE.id, LanguageMatch.COMPATIBLE)]


def test_include_all_returns_everyone_grouped_in_order(monkeypatch):
    result = available(
        monkeypatch,
        [INCOMPATIBLE, UNDECLARED, OTHER_COMPATIBLE, COMPATIBLE],
        include_all=True,
    )

    assert summary(result) == [
        (OTHER_COMPATIBLE.id, LanguageMatch.COMPATIBLE),
        (COMPATIBLE.id, LanguageMatch.COMPATIBLE),
        (UNDECLARED.id, LanguageMatch.UNDECLARED),
        (INCOMPATIBLE.id, LanguageMatch.INCOMPATIBLE),
    ]


def test_project_without_quote_is_not_filtered(monkeypatch):
    employees = [INCOMPATIBLE, UNDECLARED, COMPATIBLE]

    result = available(monkeypatch, employees, request=None)

    assert summary(result) == [
        (INCOMPATIBLE.id, None),
        (UNDECLARED.id, None),
        (COMPATIBLE.id, None),
    ]


@pytest.mark.parametrize('include_all', [False, True])
def test_declined_freelancer_stays_excluded(monkeypatch, include_all):
    result = available(
        monkeypatch,
        [COMPATIBLE, OTHER_COMPATIBLE],
        include_all=include_all,
        declined={OTHER_COMPATIBLE.id},
    )

    assert summary(result) == [(COMPATIBLE.id, LanguageMatch.COMPATIBLE)]


def test_response_keeps_existing_employee_fields(monkeypatch):
    (item,) = available(monkeypatch, [COMPATIBLE])

    public = EmployeePublicSchema.model_validate(COMPATIBLE).model_dump()
    assert item.model_dump(exclude={'language_match'}) == public


def test_real_query_without_request_disables_language_filter(monkeypatch):
    employees = [INCOMPATIBLE, UNDECLARED, COMPATIBLE]
    session = SimpleNamespace(
        scalars=AsyncMock(return_value=employees),
        scalar=AsyncMock(return_value=None),
    )
    service = StageService(session)
    monkeypatch.setattr(service, 'get_by_id', AsyncMock())
    monkeypatch.setattr(
        service, '_get_declined_freelancer_ids', AsyncMock(return_value=set())
    )

    result = asyncio.run(
        service.get_available_freelancers(
            10, SimpleNamespace(role=Roles.PROJETOS)
        )
    )

    assert session.scalar.await_count == 1
    assert summary(result) == [
        (INCOMPATIBLE.id, None),
        (UNDECLARED.id, None),
        (COMPATIBLE.id, None),
    ]
