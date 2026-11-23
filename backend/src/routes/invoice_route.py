from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.invoice_schema import (
    PaymentInvoiceCreate,
    PaymentInvoiceResponse,
)
from src.security import get_current_employee
from src.services.invoice_service import PDF_CONTENT_TYPE, InvoiceService

router = APIRouter(
    prefix='/payment-invoices',
    tags=['Payment invoices'],
)


@router.post('/', response_model=PaymentInvoiceResponse, status_code=201)
async def create_payment_invoice(
    data: PaymentInvoiceCreate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await InvoiceService(session).create_and_email(
        data, current_employee
    )


@router.get('/{invoice_id}/pdf')
async def download_payment_invoice(
    invoice_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    invoice, pdf = await InvoiceService(session).get_pdf(
        invoice_id, current_employee
    )
    return Response(
        content=pdf,
        media_type=PDF_CONTENT_TYPE,
        headers={
            'Content-Disposition': (
                f'attachment; filename="{invoice.invoice_number}.pdf"'
            )
        },
    )
