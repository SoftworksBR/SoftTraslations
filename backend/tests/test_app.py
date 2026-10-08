import pytest
from pydantic import ValidationError

from src.enums.enums import Status
from src.schemas.stage_schema import StageCreate


def test_stage_create_requires_name():
    with pytest.raises(ValidationError):
        StageCreate(freelancer_id=1, status=Status.READY)
