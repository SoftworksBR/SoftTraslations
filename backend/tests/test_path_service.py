import asyncio
from types import SimpleNamespace

from src.enums.enums import Roles
from src.models.path_model import Path
from src.models.stage_model import PathStage, StageTemplate
from src.repositories.path_repository import PathRepository
from src.schemas.path_schema import PathCreate
from src.services.path_service import PathService


def test_existing_stage_can_be_added_to_another_path(monkeypatch):
    existing_path = Path(name='Existing path')
    template = StageTemplate(name='Stage 1')
    template.id = 1
    existing_path.path_stages.append(
        PathStage(stage_template_id=template.id, sequence=1)
    )
    existing_path.path_stages[0].stage_template = template

    async def scalars(query):
        return SimpleNamespace(all=lambda: [template])

    def add(instance):
        instance.id = 2

    async def flush():
        return None

    async def create(repository, path):
        return path

    monkeypatch.setattr(PathRepository, 'create', create)

    session = SimpleNamespace(scalars=scalars, add=add, flush=flush)
    new_path = asyncio.run(
        PathService(session).create(
            PathCreate(name='Another path', stage_ids=[template.id]),
            SimpleNamespace(id=9, role=Roles.PROJETOS),
        )
    )

    assert template in existing_path.stages
    assert new_path.path_stages[0].stage_template_id == template.id
    assert new_path.path_stages[0].sequence == 1
