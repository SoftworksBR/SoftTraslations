from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.stage_controller import StageController
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.stage_schema import (
    ProjectStageCreate,
    StageResponse,
    StageSearchFilters,
    StageFileResponse,
    StageTemplateCreate,
    StageTemplateResponse,
    StageUpdate,
)
from src.security import get_current_employee

router = APIRouter(
    prefix='/stages',
    tags=['Stages'],
    dependencies=[Depends(get_current_employee)],
)


@router.post(
    '/{stage_id}/files',
    response_model=StageFileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_stage_file(
    stage_id: int,
    upload: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await StageController.upload_file(
        stage_id,
        upload,
        session,
        current_employee,
    )


@router.get('/{stage_id}/files/{file_id}')
async def download_stage_file(
    stage_id: int,
    file_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    file = await StageController.get_file(
        stage_id,
        file_id,
        session,
        current_employee,
    )
    return FileResponse(file.file_path, filename=file.original_name)


@router.post(
    '/', response_model=StageResponse, status_code=status.HTTP_201_CREATED
)
async def create_stage(
    data: ProjectStageCreate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await StageController.create(data, session, current_employee)


templates_router = APIRouter(
    prefix='/stage-templates',
    tags=['Stage templates'],
    dependencies=[Depends(get_current_employee)],
)


@templates_router.post(
    '/',
    response_model=StageTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_stage_template(
    data: StageTemplateCreate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await StageController.create_template(
        data, session, current_employee
    )


@templates_router.get('/', response_model=list[StageTemplateResponse])
async def get_stage_templates(
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await StageController.get_templates(session, current_employee)


@router.get('/', response_model=list[StageResponse])
async def get_stages(
    filters: Annotated[StageSearchFilters, Query()],
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await StageController.get_all(
        session,
        current_employee,
        filters,
    )


@router.put('/{stage_id}', response_model=StageResponse)
async def update_stage(
    stage_id: int,
    data: StageUpdate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await StageController.update(
        stage_id, data, session, current_employee
    )


@router.delete('/{stage_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_stage(
    stage_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    await StageController.delete(stage_id, session, current_employee)
