from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.schemas.stage_schema import StageResponse


class PathCreate(BaseModel):
    name: str
    stage_ids: list[int] = Field(min_length=1)

    @field_validator('stage_ids')
    @classmethod
    def stage_ids_must_be_unique(cls, stage_ids: list[int]) -> list[int]:
        if len(stage_ids) != len(set(stage_ids)):
            raise ValueError('Stage IDs must be unique')

        return stage_ids


class PathResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    stages: list[StageResponse]
