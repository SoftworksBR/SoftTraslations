
from pydantic import BaseModel, ConfigDict


class RequestCreate(BaseModel):
    username: str
    email: str
    phone: str
    company: str | None = None
    idioma_origem_id: int
    idioma_destino_id: int
    observations: str | None = None
    employee_id: int


class RequestUpdate(BaseModel):
    username: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    idioma_origem_id: int | None = None
    idioma_destino_id: int | None = None
    observations: str | None = None
    employee_id: int | None = None


class RequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    phone: str
    company: str | None
    idioma_origem_id: int
    idioma_destino_id: int
    observations: str | None
    employee_id: int
