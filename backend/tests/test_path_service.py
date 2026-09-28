import asyncio
from types import SimpleNamespace

from src.enums.enums import Roles, Status
from src.models.path_model import Path
from src.models.stage_model import Stage
from src.repositories.path_repository import PathRepository
from src.schemas.path_schema import PathCreate
from src.services.path_service import PathService


def test_existing_stage_can_be_added_to_another_path(monkeypatch):
    existing_path = Path(name='Existing path')
    stage = Stage(freelancer_id=1, status=Status.READY)
    existing_path.stages.append(stage)

    async def scalars(query):
        return SimpleNamespace(all=lambda: [stage])

    async def create(repository, path):
        return path

    monkeypatch.setattr(PathRepository, 'create', create)

    new_path = asyncio.run(
        PathService(SimpleNamespace(scalars=scalars)).create(
            PathCreate(name='Another path', stage_ids=[stage.id or 1]),
            SimpleNamespace(role=Roles.PROJETOS),
        )
    )

    assert stage in existing_path.stages
    assert stage in new_path.stages
    assert existing_path in stage.paths
    assert new_path in stage.paths
