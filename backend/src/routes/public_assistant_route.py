from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.services.public_assistant_service import send_public_message

router = APIRouter(
    prefix='/public/assistant',
    tags=['Public Assistant'],
)


class PublicAssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str | None = None


class PublicAssistantResponse(BaseModel):
    session_id: str
    response: str


@router.post('/chat', response_model=PublicAssistantResponse)
async def public_chat(data: PublicAssistantRequest):
    try:
        return await send_public_message(
            message=data.message,
            session_id=data.session_id,
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error
