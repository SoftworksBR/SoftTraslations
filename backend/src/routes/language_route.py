from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.language_controller import LanguageController
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.language_schema import (
    LanguageCreate,
    LanguageResponse,
    LanguageUpdate,
)
from src.security import get_current_employee

router = APIRouter(prefix="/idiomas", tags=["Idiomas"])


@router.post(
    "",
    response_model=LanguageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_language(
    data: LanguageCreate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await LanguageController.create(
        data, session, current_employee
    )


@router.get("", response_model=list[LanguageResponse])
async def list_languages(
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await LanguageController.list(
        session, current_employee
    )


@router.patch("/{language_id}", response_model=LanguageResponse)
async def update_language(
    language_id: int,
    data: LanguageUpdate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await LanguageController.update(
        language_id, data, session, current_employee
    )
