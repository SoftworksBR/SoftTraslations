from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.request_controller import RequestController
from src.database import get_session
from src.enums.enums import Translations
from src.schemas.request_schema import (
    RequestCreate,
    RequestResponse,
    RequestUpdate,
)
from src.security import get_current_employee

router = APIRouter(
    prefix='/requests',
    tags=['Requests'],
    dependencies=[Depends(get_current_employee)],
)


@router.post(
    '/', response_model=RequestResponse, status_code=status.HTTP_201_CREATED
)
async def create_request(
    data: RequestCreate, session: AsyncSession = Depends(get_session)
):

    return await RequestController.create(data, session)


@router.get('/', response_model=list[RequestResponse])
async def get_requests(
    session: AsyncSession = Depends(get_session),
    username: str | None = None,
    email: str | None = None,
    phone: str | None = None,
    company: str | None = None,
    translate_from: Translations | None = None,
    translate_to: Translations | None = None,
):

    return await RequestController.get_all(
        session,
        username=username,
        email=email,
        phone=phone,
        company=company,
        translate_from=translate_from,
        translate_to=translate_to,
    )


@router.get('/{request_id}', response_model=RequestResponse)
async def get_request(
    request_id: int, session: AsyncSession = Depends(get_session)
):

    return await RequestController.get_by_id(request_id, session)


@router.put('/{request_id}', response_model=RequestResponse)
async def update_request(
    request_id: int,
    data: RequestUpdate,
    session: AsyncSession = Depends(get_session),
):

    return await RequestController.update(request_id, data, session)


@router.delete('/{request_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_request(
    request_id: int, session: AsyncSession = Depends(get_session)
):

    await RequestController.delete(request_id, session)
