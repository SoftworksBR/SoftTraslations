from pydantic import BaseModel, ConfigDict, Field

from src.enums.enums import Status
from src.schemas.stage_schema import StageResponse


class PathStageCreate(BaseModel):
    freelancer_id: int
    status: Status


class PathCreate(BaseModel):
    name: str
    stages: list[PathStageCreate] = Field(min_length=1)


class PathResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    stages: list[StageResponse]
