from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.client_invoice_controller import (
    ClientInvoiceController,
)
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.client_invoice_schema import ClientInvoiceEmailResponse
from src.security import get_current_employee

router = APIRouter(
    prefix='/client-invoices',
    tags=['Client invoices'],
    dependencies=[Depends(get_current_employee)],
)


@router.post(
    '/{quote_id}/send-email',
    response_model=ClientInvoiceEmailResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_client_invoice(
    quote_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await ClientInvoiceController.create_and_email(
        quote_id,
        session,
        current_employee,
    )
