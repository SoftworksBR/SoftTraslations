from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CompanyEmployeeInput(BaseModel):
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=30)
    general_info: str | None = None


class CompanyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    primary_email: EmailStr
    website: str | None = Field(default=None, max_length=500)
    primary_phone: str = Field(min_length=1, max_length=30)
    general_info: str | None = None
    is_legal_entity: bool = True
    tax_id: str | None = Field(default=None, max_length=32)
    employees: list[CompanyEmployeeInput] = Field(default_factory=list)


class CompanyEmployeeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None
    general_info: str | None


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    primary_email: EmailStr | None
    website: str | None
    primary_phone: str | None
    general_info: str | None
    is_legal_entity: bool
    tax_id: str | None
    employees: list[CompanyEmployeeResponse]


class PersonCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=30)
    general_info: str | None = None
    is_natural_person: bool = True


class PersonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None
    general_info: str | None
    is_natural_person: bool
