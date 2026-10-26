from datetime import datetime

from pydantic import BaseModel, ConfigDict

from src.enums.enums import Status


class StageCreate(BaseModel):
    name: str
    freelancer_id: int
    status: Status = Status.READY


class StageTemplateCreate(BaseModel):
    name: str
    description: str | None = None


class StageTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None


class ProjectStageCreate(BaseModel):
    project_path_id: int
    path_stage_id: int
    freelancer_id: int | None = None


class StageUpdate(BaseModel):
    freelancer_id: int | None = None
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
    project_path_id: int
    path_stage_id: int
    freelancer_id: int | None
    status: Status
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
