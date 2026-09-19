from pydantic import BaseModel, ConfigDict

from src.enums.enums import Status


class StageCreate(BaseModel):
    freelancer_id: int
    status: Status


class StageUpdate(BaseModel):
    freelancer_id: int | None = None
    status: Status | None = None


class StageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    freelancer_id: int
    status: Status


class ProjectStageCreate(BaseModel):
    project_id: int
    stage_id: int


class ProjectStageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: int
    stage_id: int