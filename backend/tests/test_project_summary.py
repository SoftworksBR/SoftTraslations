# ruff: noqa: PLR2004
import asyncio
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.enums.enums import Roles
from src.repositories.project_repository import ProjectRepository
from src.services.project_service import ProjectService


def summarize(monkeypatch, rows, role=Roles.ADMIN):
    async def count_by_stage_statuses(self):
        return rows

    monkeypatch.setattr(
        ProjectRepository,
        'count_by_stage_statuses',
        count_by_stage_statuses,
    )
    return asyncio.run(
        ProjectService(SimpleNamespace()).get_summary(
            SimpleNamespace(role=role)
        )
    )


def test_summary_total_counts_every_project(monkeypatch):
    summary = summarize(
        monkeypatch,
        [(None, 2), (['done'], 3), (['in_progress', 'ready'], 1)],
    )

    assert summary.total == 6


def test_project_without_stages_is_awaiting(monkeypatch):
    summary = summarize(monkeypatch, [(None, 1)])

    assert (summary.awaiting, summary.in_progress, summary.completed) == (
        1,
        0,
        0,
    )


@pytest.mark.parametrize('stage_status', ['in_progress', 'testing'])
def test_project_with_stage_in_progress_is_in_progress(
    monkeypatch, stage_status
):
    summary = summarize(monkeypatch, [(['done', stage_status, 'ready'], 1)])

    assert (summary.awaiting, summary.in_progress, summary.completed) == (
        0,
        1,
        0,
    )


def test_project_with_all_stages_done_is_completed(monkeypatch):
    summary = summarize(monkeypatch, [(['done'], 1)])

    assert (summary.awaiting, summary.in_progress, summary.completed) == (
        0,
        0,
        1,
    )


def test_project_with_done_and_pending_stages_is_in_progress(monkeypatch):
    summary = summarize(monkeypatch, [(['done', 'ready'], 1)])

    assert (summary.awaiting, summary.in_progress, summary.completed) == (
        0,
        1,
        0,
    )


def test_project_with_only_unstarted_stages_is_awaiting(monkeypatch):
    summary = summarize(monkeypatch, [(['no_freelancer', 'ready'], 1)])

    assert (summary.awaiting, summary.in_progress, summary.completed) == (
        1,
        0,
        0,
    )


@pytest.mark.parametrize('role', [Roles.ADMIN, Roles.PROJETOS])
def test_admin_and_projetos_can_read_projects_summary(monkeypatch, role):
    summary = summarize(monkeypatch, [(['done'], 1)], role=role)

    assert summary.total == 1


@pytest.mark.parametrize('role', [Roles.ATENDIMENTO, Roles.FREELANCER])
def test_other_roles_cannot_read_projects_summary(monkeypatch, role):
    with pytest.raises(HTTPException) as error:
        summarize(monkeypatch, [(['done'], 1)], role=role)

    assert error.value.status_code == HTTPStatus.FORBIDDEN
