from pydantic import BaseModel, ConfigDict, EmailStr


class EmployeePublicSchema(BaseModel):
    id: int
    username: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class EmployeeSchema(BaseModel):
    username: str
    email: EmailStr
    password: str


class EmployeeListSchema(BaseModel):
    employees: list[EmployeePublicSchema]
