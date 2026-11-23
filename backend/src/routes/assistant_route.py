from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.models.employee_model import Employee
from src.security import get_current_employee
from src.services.assistant_service import send_message

router = APIRouter(
    prefix='/assistant',
    tags=['Assistant'],
)


class AssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str | None = None


class AssistantResponse(BaseModel):
    session_id: str
    response: str


@router.post('/chat', response_model=AssistantResponse)
async def chat(
    data: AssistantRequest,
    current_employee: Employee = Depends(get_current_employee),
):
    try:
        return await send_message(
            message=data.message,
            user_id=current_employee.email,
            session_id=data.session_id,
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error