from pydantic import BaseModel, ConfigDict

from src.enums.enums import Status


class StageCreate(BaseModel):
    path_id: int
    freelancer_id: int
    status: Status


class StageUpdate(BaseModel):
    freelancer_id: int | None = None
    status: Status | None = None


class StageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    path_id: int
    freelancer_id: int
    status: Status


class PathProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    path_id: int
    project_id: int
