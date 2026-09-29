from pydantic import BaseModel, ConfigDict, model_validator

from src.enums.enums import FreelancerType, Status


class StageCreate(BaseModel):
    freelancer_id: int | None = None
    freelancer_type: FreelancerType | None = None
    name: str
    status: Status

    @model_validator(mode='after')
    def requires_freelancer_id_or_type(self):
        if self.freelancer_id is None and self.freelancer_type is None:
            raise ValueError(
                'Stage must have a freelancer_id or a freelancer_type'
            )

        return self


class StageUpdate(BaseModel):
    freelancer_id: int | None = None
    freelancer_type: FreelancerType | None = None
    name: str | None = None
    status: Status | None = None


class StageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    freelancer_id: int | None
    freelancer_type: FreelancerType | None
    status: Status


class PathProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    path_id: int
    project_id: int
