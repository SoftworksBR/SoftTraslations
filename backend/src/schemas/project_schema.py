from pydantic import BaseModel, ConfigDict, Field

from src.enums.enums import Status
from src.schemas.path_schema import PathResponse


class ProjectCreate(BaseModel):
    name: str
    status: Status
    creator_id: int
    path_ids: list[int] = Field(min_length=1)


class ProjectUpdate(BaseModel):
    name: str | None = None
    status: Status | None = None
    creator_id: int | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    status: Status
    creator_id: int
    paths: list[PathResponse]

    model_config = ConfigDict(from_attributes=True)
