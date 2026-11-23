import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

from src.enums.enums import (
    Roles,
    StageCollaborationStatus,
    StageStatus,
    Status,
)
from src.repositories.project_repository import ProjectRepository
from src.services.project_service import ProjectService


def make_stage(stage_id, sequence, **second):
    values = {
        'second_freelancer_id': None,
        'second_freelancer_name': None,
        'second_status': None,
    }
    values.update(second)
    return SimpleNamespace(
        id=stage_id,
        name=f'Etapa {stage_id}',
        status=StageStatus.IN_PROGRESS,
        freelancer_id=7,
        freelancer=SimpleNamespace(username='principal'),
        path_stage=SimpleNamespace(sequence=sequence),
        files=[],
        **values,
    )


def test_project_details_expose_second_freelancer(monkeypatch):
    project = SimpleNamespace(
        id=1,
        name='ACME',
        status=Status.READY,
        creator_id=1,
        creator=SimpleNamespace(username='gestor'),
        project_paths=[
            SimpleNamespace(
                id=1,
                path=SimpleNamespace(name='Trilha'),
                sequence=1,
                executions=[
                    make_stage(
                        11,
                        1,
                        second_freelancer_id=8,
                        second_freelancer_name='segundo',
                        second_status=StageCollaborationStatus.ACCEPTED,
                    ),
                    make_stage(12, 2),
                ],
            )
        ],
    )
    monkeypatch.setattr(
        ProjectRepository, 'get_by_id', AsyncMock(return_value=project)
    )

    details = asyncio.run(
        ProjectService(SimpleNamespace()).get_details(
            1, SimpleNamespace(id=1, role=Roles.ADMIN)
        )
    )

    with_second, without_second = details.paths[0].stages
    assert with_second.second_freelancer_id == 8  # noqa: PLR2004
    assert with_second.second_freelancer_name == 'segundo'
    assert with_second.second_status == StageCollaborationStatus.ACCEPTED
    assert without_second.second_freelancer_id is None
    assert without_second.second_freelancer_name is None
    assert without_second.second_status is None


def test_project_details_load_second_freelancer_eagerly():
    result = SimpleNamespace(scalar_one_or_none=lambda: None)
    session = SimpleNamespace(execute=AsyncMock(return_value=result))

    asyncio.run(ProjectRepository(session).get_by_id(1))

    statement = session.execute.await_args.args[0]
    loaded = {
        str(option.path.path[-2])
        for option in statement._with_options  # noqa: SLF001
    }
    assert 'ProjectStage.second_freelancer' in loaded
    assert 'ProjectStage.freelancer' in loaded
