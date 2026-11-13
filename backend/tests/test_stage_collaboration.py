from src.enums.enums import StageCollaborationStatus
from src.models.stage_model import ProjectStage


def test_new_stage_has_no_second_freelancer():
    stage = ProjectStage(project_path_id=1, path_stage_id=2, path_id=3)

    assert stage.second_freelancer_id is None
    assert stage.second_status is None


def test_second_freelancer_columns_match_migration():
    columns = ProjectStage.__table__.c
    (foreign_key,) = columns.second_freelancer_id.foreign_keys

    assert columns.second_freelancer_id.nullable
    assert foreign_key.target_fullname == 'employees.id'
    assert foreign_key.ondelete == 'SET NULL'
    assert columns.second_status.nullable
    assert columns.second_status.type.name == 'stage_collaboration_status'
    assert columns.second_status.type.enums == [
        status.value for status in StageCollaborationStatus
    ]
