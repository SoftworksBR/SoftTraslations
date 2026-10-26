from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.project_controller import ProjectController
from src.controllers.stage_controller import StageController
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.path_schema import PathResponse
from src.schemas.project_schema import (
    ProjectCreate,
    ProjectDetailsResponse,
    ProjectResponse,
    ProjectSearchFilters,
    ProjectUpdate,
)
from src.security import get_current_employee

router = APIRouter(
    prefix='/projects',
    tags=['Projects'],
    dependencies=[Depends(get_current_employee)],
)


@router.post(
    '/', response_model=ProjectResponse, status_code=status.HTTP_201_CREATED
)
async def create_project(
    data: ProjectCreate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await ProjectController.create(data, session, current_employee)


@router.put(
    '/{project_id}/paths/{path_id}',
    response_model=PathResponse,
    status_code=status.HTTP_200_OK,
)
async def assign_path_to_project(
    project_id: int,
    path_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await StageController.assign_path_to_project(
        project_id,
        path_id,
        session,
        current_employee,
    )


@router.get('/', response_model=list[ProjectResponse])
async def get_projects(
    filters: Annotated[ProjectSearchFilters, Query()],
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await ProjectController.get_all(
        session,
        current_employee,
        filters,
    )


@router.get('/{project_id}/details', response_model=ProjectDetailsResponse)
async def get_project_details(
    project_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await ProjectController.get_details(
        project_id,
        session,
        current_employee,
    )


@router.get('/{project_id}/files/{file_id}')
async def download_project_file(
    project_id: int,
    file_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    file = await ProjectController.get_project_file(
        project_id,
        file_id,
        session,
        current_employee,
    )
    return FileResponse(file.file_path, filename=file.original_name)


@router.put('/{project_id}', response_model=ProjectResponse)
async def update_project(
    project_id: int,
    data: ProjectUpdate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await ProjectController.update(
        project_id, data, session, current_employee
    )


@router.delete('/{project_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    await ProjectController.delete(project_id, session, current_employee)
