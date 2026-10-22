from datetime import date

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    model_validator,
)

from src.enums.enums import AccountStatus, EmployeeStatus, Roles


class EmployeePublicSchema(BaseModel):
    id: int
    username: str
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr
    birth_date: date | None = None
    photo_url: str | None = None
    phone: str | None = None
    role: Roles
    status: EmployeeStatus
    account_status: AccountStatus
    profile_completed: bool = False

    model_config = ConfigDict(from_attributes=True)


class EmployeeSchema(BaseModel):
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr
    birth_date: date | None = None
    photo_url: str | None = None
    phone: str | None = None
    role: Roles
    status: EmployeeStatus = EmployeeStatus.AVAILABLE
    password: str

    @model_validator(mode='after')
    def validate_registration_fields(self):
        if self.role != Roles.ADMIN and not (
            self.first_name and self.last_name
        ):
            raise ValueError(
                'First and last name are required for non-admin employees'
            )
        if (
            self.status == EmployeeStatus.PENDING
            and self.role != Roles.FREELANCER
        ):
            raise ValueError('Only freelancers can have pending status')

        return self


class EmployeeListSchema(BaseModel):
    employees: list[EmployeePublicSchema]


class EmployeeSearchFilters(BaseModel):
    username: str | None = None
    email: str | None = None
    role: Roles | None = None


class FreelancerPreRegistrationSchema(BaseModel):
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str


class FreelancerProfileSchema(BaseModel):
    birth_date: date
    phone: str = Field(min_length=1, max_length=30)
    photo_url: str | None = None
    specialization: str | None = None
    bio: str | None = None
    hourly_rate: float | None = Field(default=None, ge=0)
