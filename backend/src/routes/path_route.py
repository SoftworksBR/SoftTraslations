from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.path_controller import PathController
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.path_schema import PathCreate, PathResponse
from src.security import get_current_employee

router = APIRouter(
    prefix='/paths',
    tags=['Paths'],
    dependencies=[Depends(get_current_employee)],
)


@router.post(
    '/', response_model=PathResponse, status_code=status.HTTP_201_CREATED
)
async def create_path(
    data: PathCreate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await PathController.create(data, session, current_employee)


@router.get('/', response_model=list[PathResponse])
async def get_paths(
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await PathController.get_all(session, current_employee)


@router.delete('/{path_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_path(
    path_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    await PathController.delete(path_id, session, current_employee)
