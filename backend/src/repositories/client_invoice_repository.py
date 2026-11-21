from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.client_invoice_model import ClientInvoice


class ClientInvoiceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, invoice: ClientInvoice) -> ClientInvoice:
        self.session.add(invoice)

        await self.session.commit()

        return await self.get_by_id(invoice.id)

    async def get_by_id(self, invoice_id: int) -> ClientInvoice | None:
        result = await self.session.execute(
            select(ClientInvoice).where(ClientInvoice.id == invoice_id)
        )

        return result.scalar_one_or_none()

    async def get_by_quote_id(
        self,
        quote_id: int,
    ) -> ClientInvoice | None:
        result = await self.session.execute(
            select(ClientInvoice).where(
                ClientInvoice.quote_id == quote_id
            )
        )

        return result.scalar_one_or_none()

    async def update(self, invoice: ClientInvoice) -> ClientInvoice:
        await self.session.commit()

        return await self.get_by_id(invoice.id)
