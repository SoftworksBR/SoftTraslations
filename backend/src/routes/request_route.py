from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.request_controller import RequestController
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.request_schema import (
    RequestCreate,
    RequestCreatedResponse,
    RequestFileResponse,
    RequestOptionsResponse,
    RequestPublicResponse,
    RequestPublicUpdate,
    RequestResponse,
    RequestSearchFilters,
    RequestUpdate,
)
from src.security import get_current_employee

# Rotas abertas: o cliente não tem login. Ele acompanha a própria
# solicitação pelo token devolvido na criação.
public_router = APIRouter(
    prefix='/requests',
    tags=['Requests'],
)
protected_router = APIRouter(prefix='/requests', tags=['Requests'])


@public_router.get('/options', response_model=RequestOptionsResponse)
async def get_request_options(
    session: AsyncSession = Depends(get_session),
):
    return await RequestController.get_options(session)


@public_router.post(
    '/',
    response_model=RequestCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_request(
    data: RequestCreate,
    session: AsyncSession = Depends(get_session),
):
    request = await RequestController.create(data, session)

    return RequestCreatedResponse.model_validate({
        **RequestResponse.model_validate(request).model_dump(),
        'public_token': request.public_token,
    })


@public_router.get('/public/{token}', response_model=RequestPublicResponse)
async def get_public_request(
    token: str,
    session: AsyncSession = Depends(get_session),
):
    return await RequestController.get_public(token, session)


@public_router.put('/public/{token}', response_model=RequestPublicResponse)
async def update_public_request(
    token: str,
    data: RequestPublicUpdate,
    session: AsyncSession = Depends(get_session),
):
    return await RequestController.update_public(token, data, session)


@public_router.delete(
    '/public/{token}', status_code=status.HTTP_204_NO_CONTENT
)
async def delete_public_request(
    token: str,
    session: AsyncSession = Depends(get_session),
):
    await RequestController.delete_public(token, session)


@public_router.post(
    '/public/{token}/files',
    response_model=RequestFileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_public_request_file(
    token: str,
    file: Annotated[UploadFile, File()],
    session: AsyncSession = Depends(get_session),
):
    return await RequestController.add_file_public(token, file, session)


@protected_router.get('/', response_model=list[RequestResponse])
async def get_requests(
    filters: Annotated[RequestSearchFilters, Query()],
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await RequestController.get_all(
        session,
        current_employee,
        filters,
    )


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


@protected_router.get(
    '/{request_id}/files', response_model=list[RequestFileResponse]
)
async def list_request_files(
    request_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await RequestController.list_files(
        request_id, session, current_employee
    )


@protected_router.get('/{request_id}/files/{file_id}')
async def download_request_file(
    request_id: int,
    file_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    file = await RequestController.get_file(
        request_id, file_id, session, current_employee
    )

    return FileResponse(file.file_path, filename=file.original_name)
