from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.project_controller import ProjectController
from src.controllers.stage_controller import StageController
from src.database import get_session
from src.enums.enums import Status
from src.schemas.project_schema import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from src.schemas.stage_schema import ProjectStageCreate, StageResponse
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
    data: ProjectCreate, session: AsyncSession = Depends(get_session)
):
    return await ProjectController.create(data, session)


@router.post(
    '/{project_id}/stages',
    response_model=StageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_project_stage(
    project_id: int,
    data: ProjectStageCreate,
    session: AsyncSession = Depends(get_session),
):
    return await StageController.create_for_project(
        project_id,
        data,
        session,
    )


@router.get('/', response_model=list[ProjectResponse])
async def get_projects(
    session: AsyncSession = Depends(get_session),
    name: str | None = None,
    status: Status | None = None,
    stage_name: str | None = None,
    freelancer_name: str | None = None,
    creator_name: str | None = None,
):
    return await ProjectController.get_all(
        session,
        name=name,
        status=status,
        stage_name=stage_name,
        freelancer_name=freelancer_name,
        creator_name=creator_name,
    )


@router.get('/{project_id}', response_model=ProjectResponse)
async def get_project(
    project_id: int, session: AsyncSession = Depends(get_session)
):
    return await ProjectController.get_by_id(project_id, session)


@router.put('/{project_id}', response_model=ProjectResponse)
async def update_project(
    project_id: int,
    data: ProjectUpdate,
    session: AsyncSession = Depends(get_session),
):
    return await ProjectController.update(project_id, data, session)


@router.delete('/{project_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int, session: AsyncSession = Depends(get_session)
):
    await ProjectController.delete(project_id, session)
