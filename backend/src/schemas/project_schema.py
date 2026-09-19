from pydantic import BaseModel, ConfigDict

from src.enums.enums import Status


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

    model_config = ConfigDict(from_attributes=True)
