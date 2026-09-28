from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    model_validator,
)

from src.enums.enums import EmployeeStatus, Roles


class EmployeePublicSchema(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: Roles
    status: EmployeeStatus

    model_config = ConfigDict(from_attributes=True)


class EmployeeSchema(BaseModel):
    username: str
    email: EmailStr
    role: Roles
    status: EmployeeStatus = EmployeeStatus.AVAILABLE
    password: str

    @model_validator(mode='after')
    def pending_requires_freelancer(self):
        if (
            self.status == EmployeeStatus.PENDING
            and self.role != Roles.FREELANCER
        ):
            raise ValueError('Only freelancers can have pending status')

        return self


class EmployeeListSchema(BaseModel):
    employees: list[EmployeePublicSchema]


class FreelancerPreRegistrationSchema(BaseModel):
    email: EmailStr
    password: str


class FreelancerProfileSchema(BaseModel):
    name: str = Field(min_length=1)
