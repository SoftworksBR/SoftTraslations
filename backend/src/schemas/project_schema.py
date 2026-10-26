from pydantic import BaseModel, ConfigDict, Field

from src.enums.enums import Status
from src.schemas.path_schema import PathResponse


class ProjectCreate(BaseModel):
    name: str
    status: Status = Status.READY
    # Obsoleto: o criador é sempre o funcionário autenticado.
    creator_id: int | None = None
    # Orçamento aprovado que originou o projeto.
    quote_id: int | None = None
    # Todo projeto nasce com ao menos uma trilha.
    path_ids: list[int] = Field(min_length=1)


class ProjectUpdate(BaseModel):
    name: str | None = None
    status: Status | None = None
    creator_id: int | None = None


class ProjectSearchFilters(BaseModel):
    name: str | None = None
    status: Status | None = None
    stage_name: str | None = None
    freelancer_name: str | None = None
    creator_name: str | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    status: Status
    creator_id: int
    quote_id: int | None = None
    paths: list[PathResponse]

    model_config = ConfigDict(from_attributes=True)
