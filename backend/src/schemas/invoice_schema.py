from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class PaymentInvoiceCreate(BaseModel):
    freelancer_id: int
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    description: str = Field(min_length=1, max_length=500)
    issued_on: date | None = None
    project_id: int | None = None
    stage_id: int | None = None


class PaymentInvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_number: str
    freelancer_id: int
    created_by_id: int
    project_id: int | None
    stage_id: int | None
    description: str
    amount: Decimal
    issued_on: date
    emailed_at: datetime | None


class PaymentInvoiceEmailResponse(BaseModel):
    invoice: PaymentInvoiceResponse
    recipient: str
