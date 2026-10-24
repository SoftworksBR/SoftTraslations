import asyncio
from types import SimpleNamespace

from src.enums.enums import Roles
from src.models.path_model import Path
from src.models.stage_model import PathStage, StageTemplate
from src.repositories.path_repository import PathRepository
from src.schemas.path_schema import PathCreate, PathResponse
from src.services.path_service import PathService


def test_path_creation_creates_ordered_stage_template_associations(
    monkeypatch,
):
    templates = [SimpleNamespace(id=1), SimpleNamespace(id=2)]
    created_path = {}

    async def scalars(query):
        return SimpleNamespace(all=lambda: templates)

    async def create(repository, path):
        created_path['path'] = path
        return path

    monkeypatch.setattr(PathRepository, 'create', create)

    path = asyncio.run(
        PathService(SimpleNamespace(scalars=scalars)).create(
            PathCreate(name='Translation path', stage_ids=[2, 1]),
            SimpleNamespace(role=Roles.PROJETOS),
        )
    )

    assert path is created_path['path']
    assert all(isinstance(item, PathStage) for item in path.path_stages)
    assert [
        (item.stage_template_id, item.sequence) for item in path.path_stages
    ] == [(2, 1), (1, 2)]


def test_path_response_serializes_stage_templates():
    template = StageTemplate(name='Review', description='Proofread')
    template.id = 1
    path = Path(name='Translation')
    path.id = 2
    path_stage = PathStage(stage_template_id=template.id, sequence=1)
    path_stage.id = 3
    path_stage.path_id = path.id
    path_stage.stage_template = template
    path.path_stages.append(path_stage)

    response = PathResponse.model_validate(path)

    assert response.stages[0].id == template.id
    assert response.stages[0].name == template.name
    assert response.stages[0].description == template.description
