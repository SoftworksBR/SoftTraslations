from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.client_invoice_schema import ClientInvoiceEmailResponse
from src.services.client_invoice_service import ClientInvoiceService


class ClientInvoiceController:
    @staticmethod
    async def create_and_email(
        quote_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ) -> ClientInvoiceEmailResponse:
        service = ClientInvoiceService(session)
        return await service.create_and_email(quote_id, current_employee)
