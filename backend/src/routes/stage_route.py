from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.stage_controller import StageController
from src.database import get_session
from src.schemas.stage_schema import StageCreate, StageResponse, StageUpdate
from src.security import get_current_employee, require_roles
from src.enums.enums import Roles

router = APIRouter(
    prefix='/stages',
    tags=['Stages'],
    dependencies=[Depends(require_roles(Roles.ADMIN, Roles.PROJETOS))],
)


@router.post(
    '/', response_model=StageResponse, status_code=status.HTTP_201_CREATED
)
async def create_stage(
    data: StageCreate, session: AsyncSession = Depends(get_session)
):
    return await StageController.create(data, session)


@router.get('/', response_model=list[StageResponse])
async def get_stages(session: AsyncSession = Depends(get_session)):
    return await StageController.get_all(session)


@router.get('/{stage_id}', response_model=StageResponse)
async def get_stage(
    stage_id: int, session: AsyncSession = Depends(get_session)
):
    return await StageController.get_by_id(stage_id, session)


@router.put('/{stage_id}', response_model=StageResponse)
async def update_stage(
    stage_id: int,
    data: StageUpdate,
    session: AsyncSession = Depends(get_session),
):
    return await StageController.update(stage_id, data, session)


@router.delete('/{stage_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_stage(
    stage_id: int, session: AsyncSession = Depends(get_session)
):
    await StageController.delete(stage_id, session)
