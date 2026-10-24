import asyncio
from types import SimpleNamespace

from src.enums.enums import Roles, Status
from src.models.path_model import Path
from src.models.project_model import Project
from src.models.stage_model import PathStage, ProjectStage
from src.repositories.project_repository import ProjectRepository
from src.schemas.project_schema import ProjectCreate
from src.services.project_service import ProjectService
from src.services.stage_service import StageService

PROJECT_PATH_ID = 31


def test_project_creation_builds_sequenced_paths_and_stage_executions(
    monkeypatch,
):
    paths = []
    for path_id, stage_id in ((1, 11), (2, 22)):
        path = Path(name=f'Path {path_id}')
        path.id = path_id
        path_stage = PathStage(stage_template_id=stage_id, sequence=1)
        path_stage.id = stage_id
        path_stage.path_id = path_id
        path.path_stages.append(path_stage)
        paths.append(path)

    class Session:
        @staticmethod
        async def scalars(query):
            return SimpleNamespace(all=lambda: paths)

        def add(self, project):
            self.project = project

        async def flush(self):
            self.project.id = 30
            for path_sequence, project_path in enumerate(
                self.project.project_paths, start=1
            ):
                project_path.id = 30 + path_sequence
                project_path.project_id = self.project.id

    async def create(repository, project):
        return project

    monkeypatch.setattr(ProjectRepository, 'create', create)
    session = Session()

    project = asyncio.run(
        ProjectService(session).create(
            ProjectCreate(name='Project', path_ids=[2, 1]),
            SimpleNamespace(role=Roles.PROJETOS, id=7),
        )
    )

    assert [
        (item.path_id, item.sequence) for item in project.project_paths
    ] == [(2, 1), (1, 2)]
    assert all(
        isinstance(execution, ProjectStage)
        and execution.status == Status.READY
        for project_path in project.project_paths
        for execution in project_path.executions
    )
    assert [
        execution.path_stage_id
        for project_path in project.project_paths
        for execution in project_path.executions
    ] == [22, 11]


def test_assigning_path_creates_project_path_and_stage_executions():
    project = Project(
        name='Project',
        status=Status.READY,
        creator_id=7,
    )
    project.id = 30
    path = Path(name='Path')
    path.id = 2
    path_stage = PathStage(stage_template_id=11, sequence=1)
    path_stage.id = 12
    path_stage.path_id = path.id
    path.path_stages.append(path_stage)

    class Session:
        def __init__(self):
            self.scalar_calls = 0
            self.added_project_path = None
            self.executions = []

        async def scalar(self, query):
            self.scalar_calls += 1
            return project if self.scalar_calls == 1 else path

        def add(self, association):
            self.added_project_path = association

        async def flush(self):
            self.added_project_path.id = PROJECT_PATH_ID
            self.added_project_path.project_id = project.id

        def add_all(self, executions):
            self.executions.extend(executions)

        @staticmethod
        async def commit():
            return None

    session = Session()
    result = asyncio.run(
        StageService(session).assign_path_to_project(
            project.id,
            path.id,
            SimpleNamespace(role=Roles.PROJETOS),
        )
    )

    assert result is path
    assert session.added_project_path.path_id == path.id
    assert session.added_project_path.sequence == 1
    assert len(session.executions) == 1
    assert session.executions[0].project_path_id == PROJECT_PATH_ID
    assert session.executions[0].path_stage_id == path_stage.id
    assert session.executions[0].status == Status.READY
