from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.request_controller import RequestController
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.request_schema import (
    RequestCreate,
    RequestResponse,
    RequestUpdate,
)
from src.security import get_current_employee

public_router = APIRouter(
    prefix='/requests',
    tags=['Requests'],
)
protected_router = APIRouter(prefix='/requests', tags=['Requests'])


@public_router.post(
    '/', response_model=RequestResponse, status_code=status.HTTP_201_CREATED
)
async def create_request(
    data: RequestCreate,
    session: AsyncSession = Depends(get_session),
):

    return await RequestController.create(data, session)


@protected_router.get('/', response_model=list[RequestResponse])
async def get_requests(
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):

    return await RequestController.get_all(session, current_employee)


@protected_router.put('/{request_id}', response_model=RequestResponse)
async def update_request(
    request_id: int,
    data: RequestUpdate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):

    return await RequestController.update(
        request_id, data, session, current_employee
    )


@protected_router.delete(
    '/{request_id}', status_code=status.HTTP_204_NO_CONTENT
)
async def delete_request(
    request_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):

    await RequestController.delete(request_id, session, current_employee)
