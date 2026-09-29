import asyncio
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.enums.enums import Roles, Status
from src.models.path_model import Path
from src.models.stage_model import Stage
from src.repositories.path_repository import PathRepository
from src.schemas.path_schema import PathCreate
from src.services.path_service import PathService


def _stage(stage_id: int, name: str) -> Stage:
    stage = Stage(name=name, freelancer_id=1, status=Status.READY)
    stage.id = stage_id

    return stage


def test_existing_stage_can_be_added_to_another_path(monkeypatch):
    existing_path = Path(name='Existing path')
    stage = _stage(1, 'Stage 1')
    existing_path.stages.append(stage)

    async def scalars(query):
        return SimpleNamespace(all=lambda: [stage])

    async def create(repository, path):
        return path

    monkeypatch.setattr(PathRepository, 'create', create)

    new_path = asyncio.run(
        PathService(SimpleNamespace(scalars=scalars)).create(
            PathCreate(name='Another path', stage_ids=[stage.id]),
            SimpleNamespace(role=Roles.PROJETOS),
        )
    )

    assert stage in existing_path.stages
    assert stage in new_path.stages
    assert existing_path in stage.paths
    assert new_path in stage.paths


def test_path_preserves_the_order_the_stages_were_selected_in(monkeypatch):
    stage_1 = _stage(1, 'Stage 1')
    stage_2 = _stage(2, 'Stage 2')
    stage_3 = _stage(3, 'Stage 3')

    # O banco devolve as linhas fora de ordem (ex.: ordenadas por id), como
    # de fato acontece com um SELECT ... WHERE id IN (...) sem ORDER BY.
    async def scalars(query):
        return SimpleNamespace(all=lambda: [stage_1, stage_2, stage_3])

    async def create(repository, path):
        return path

    monkeypatch.setattr(PathRepository, 'create', create)

    new_path = asyncio.run(
        PathService(SimpleNamespace(scalars=scalars)).create(
            PathCreate(name='Trilha', stage_ids=[3, 1, 2]),
            SimpleNamespace(role=Roles.PROJETOS),
        )
    )

    assert new_path.stages == [stage_3, stage_1, stage_2]


def test_projects_role_can_delete_a_path(monkeypatch):
    path = Path(name='Trilha a excluir')
    deleted_paths = []

    async def get_by_id(self, path_id):
        return path

    async def delete(self, deleted_path):
        deleted_paths.append(deleted_path)

    monkeypatch.setattr(PathRepository, 'get_by_id', get_by_id)
    monkeypatch.setattr(PathRepository, 'delete', delete)

    asyncio.run(
        PathService(session=None).delete(
            path_id=1,
            current_employee=SimpleNamespace(role=Roles.PROJETOS),
        )
    )

    assert deleted_paths == [path]


def test_only_projects_role_can_delete_a_path():
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            PathService(session=None).delete(
                path_id=1,
                current_employee=SimpleNamespace(role=Roles.FREELANCER),
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN


def test_deleting_a_path_that_does_not_exist_raises_not_found(monkeypatch):
    async def get_by_id(self, path_id):
        return None

    monkeypatch.setattr(PathRepository, 'get_by_id', get_by_id)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            PathService(session=None).delete(
                path_id=999,
                current_employee=SimpleNamespace(role=Roles.PROJETOS),
            )
        )

    assert error.value.status_code == HTTPStatus.NOT_FOUND
