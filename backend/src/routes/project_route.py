from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.project_controller import ProjectController
from src.database import get_session
from src.schemas.project_schema import (
    ProjectCreate,
    ProjectResponse,
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
    data: ProjectCreate, session: AsyncSession = Depends(get_session)
):
    return await ProjectController.create(data, session)


@router.get('/', response_model=list[ProjectResponse])
async def get_projects(session: AsyncSession = Depends(get_session)):
    return await ProjectController.get_all(session)


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
