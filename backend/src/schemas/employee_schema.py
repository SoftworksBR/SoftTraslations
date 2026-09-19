from pydantic import BaseModel, ConfigDict, EmailStr

from src.enums.enums import Roles

class EmployeePublicSchema(BaseModel):
    id: int
    username: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class EmployeeSchema(BaseModel):
    username: str
    email: EmailStr
    role: Roles
    password: str


class EmployeeListSchema(BaseModel):
    employees: list[EmployeePublicSchema]
