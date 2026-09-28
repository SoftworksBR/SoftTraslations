from pydantic import BaseModel, ConfigDict, Field

from src.enums.enums import Status
from src.schemas.stage_schema import StageResponse


class ProjectCreate(BaseModel):
    name: str
    status: Status
    creator_id: int


class ProjectUpdate(BaseModel):
    name: str | None = None
    status: Status | None = None
    creator_id: int | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    status: Status
    creator_id: int
    stages: list[StageResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
