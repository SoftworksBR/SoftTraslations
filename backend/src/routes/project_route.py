from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.project_controller import ProjectController
from src.controllers.stage_controller import StageController
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.project_schema import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from src.schemas.stage_schema import StageResponse
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
    '/{project_id}/stages/{stage_id}',
    response_model=StageResponse,
    status_code=status.HTTP_200_OK,
)
async def assign_stage_to_project(
    project_id: int,
    stage_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await StageController.assign_to_project(
        project_id,
        stage_id,
        session,
        current_employee,
    )


@router.get('/', response_model=list[ProjectResponse])
async def get_projects(
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await ProjectController.get_all(session, current_employee)


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
