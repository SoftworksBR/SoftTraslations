from pydantic import BaseModel, ConfigDict

from src.enums.enums import Status


class StageCreate(BaseModel):
    name: str


class StageUpdate(BaseModel):
    freelancer_id: int | None = None
    name: str | None = None
    status: Status | None = None


class StageSearchFilters(BaseModel):
    name: str | None = None
    status: Status | None = None
    project_name: str | None = None
    freelancer_name: str | None = None


class StageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    freelancer_id: int | None
    status: Status


class PathProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    path_id: int
    project_id: int
