from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.preco_traducao_controller import (
    TranslationPriceController,
)
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.translation_price_schema import (
    TranslationPriceCreate,
    TranslationPriceResponse,
    TranslationPriceUpdate,
)
from src.security import get_current_employee

router = APIRouter(
    prefix="/precos-traducao",
    tags=["Preços de tradução"],
)


@router.post(
    "",
    response_model=TranslationPriceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_translation_price(
    data: TranslationPriceCreate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await TranslationPriceController.create(
        data, session, current_employee
    )


@router.get("", response_model=list[TranslationPriceResponse])
async def list_translation_prices(
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await TranslationPriceController.list(
        session, current_employee
    )


@router.patch(
    "/{price_id}",
    response_model=TranslationPriceResponse,
)
async def update_translation_price(
    price_id: int,
    data: TranslationPriceUpdate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await TranslationPriceController.update(
        price_id, data, session, current_employee
    )
