from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ClientInvoiceCreate(BaseModel):
    quote_id: int


class ClientInvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_number: str
    quote_id: int
    created_by_id: int
    client_name: str
    client_email: str
    description: str
    amount: Decimal
    issued_on: date
    emailed_at: datetime | None
    created_at: datetime


class ClientInvoiceEmailResponse(BaseModel):
    invoice: ClientInvoiceResponse
    recipient: str
