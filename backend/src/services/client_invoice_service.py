from datetime import UTC, date, datetime
from email.message import EmailMessage
from email.utils import formataddr
from http import HTTPStatus
from smtplib import SMTP, SMTP_SSL, SMTPException

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import QuoteStatus, Roles
from src.models.client_invoice_model import ClientInvoice
from src.models.employee_model import Employee
from src.repositories.client_invoice_repository import (
    ClientInvoiceRepository,
)
from src.repositories.quote_repository import QuoteRepository
from src.schemas.client_invoice_schema import (
    ClientInvoiceEmailResponse,
)
from src.services.client_invoice_pdf import render_client_invoice_pdf
from src.settings import Settings


class ClientInvoiceService:
    def __init__(
        self,
        session: AsyncSession,
        settings: Settings | None = None,
    ):
        self.session = session
        self.repository = ClientInvoiceRepository(session)
        self.quote_repository = QuoteRepository(session)
        self.settings = settings or Settings()

    async def create_and_email(
        self,
        quote_id: int,
        current_employee: Employee,
    ) -> ClientInvoiceEmailResponse:
        self._require_atendimento_access(current_employee)

        quote = await self.quote_repository.get_by_id(quote_id)

        if quote is None:
            raise HTTPException(
                status_code=HTTPStatus.NOT_FOUND,
                detail='Orçamento não encontrado',
            )

        if quote.status != QuoteStatus.APPROVED:
            raise HTTPException(
                status_code=HTTPStatus.CONFLICT,
                detail=(
                    'A fatura só pode ser emitida para orçamentos aprovados'
                ),
            )

        existing_invoice = await self.repository.get_by_quote_id(quote.id)

        if existing_invoice is not None:
            raise HTTPException(
                status_code=HTTPStatus.CONFLICT,
                detail='Já existe uma fatura para este orçamento',
            )

        service_name = quote.service_name or 'Serviço de tradução'

        description = (
            f'{service_name} - '
            f'{quote.source_language_name} para '
            f'{quote.target_language_name}'
        )

        invoice = ClientInvoice(
            invoice_number='PENDING',
            quote_id=quote.id,
            created_by_id=current_employee.id,
            client_name=quote.client_name,
            client_email=quote.client_email,
            description=description,
            amount=quote.value,
            issued_on=date.today(),
        )

        try:
            self.session.add(invoice)
            await self.session.flush()

            invoice.invoice_number = (
                f'FAT-{invoice.issued_on:%Y%m%d}-{invoice.id:06d}'
            )

            await self.session.commit()

        except IntegrityError as error:
            await self.session.rollback()
            raise HTTPException(
                status_code=HTTPStatus.CONFLICT,
                detail='Já existe uma fatura para este orçamento',
            ) from error

        try:
            self._send_email(invoice)
        except (OSError, SMTPException) as error:
            raise HTTPException(
                status_code=HTTPStatus.BAD_GATEWAY,
                detail='Fatura criada, mas o envio do e-mail falhou',
            ) from error

        invoice.emailed_at = datetime.now(UTC)
        await self.session.commit()

        return ClientInvoiceEmailResponse(
            invoice=invoice,
            recipient=invoice.client_email,
        )

    def _send_email(self, invoice: ClientInvoice) -> None:
        if not self.settings.SMTP_HOST or not self.settings.SMTP_FROM_EMAIL:
            raise SMTPException('SMTP email settings are not configured')

        pdf = render_client_invoice_pdf(invoice)

        message = EmailMessage()
        message['Subject'] = (
            f'Fatura SoftTranslations - {invoice.invoice_number}'
        )
        message['From'] = formataddr(
            (self.settings.SMTP_FROM_NAME, self.settings.SMTP_FROM_EMAIL)
        )
        message['To'] = invoice.client_email

        message.set_content(
            f'Olá, {invoice.client_name}.\n\n'
            'Estamos encaminhando em anexo a fatura referente '
            'ao serviço contratado.\n\n'
            f'Número da fatura: {invoice.invoice_number}\n'
            f'Valor: R$ {invoice.amount:.2f}\n'
            f'Data de emissão: {invoice.issued_on:%d/%m/%Y}\n\n'
            'Em caso de dúvidas, entre em contato com nossa equipe.\n\n'
            'Atenciosamente,\n'
            'Equipe SoftTranslations'
        )

        message.add_attachment(
            pdf,
            maintype='application',
            subtype='pdf',
            filename=f'{invoice.invoice_number}.pdf',
        )

        smtp_type = SMTP_SSL if self.settings.SMTP_USE_SSL else SMTP

        with smtp_type(
            self.settings.SMTP_HOST,
            self.settings.SMTP_PORT,
            timeout=self.settings.SMTP_TIMEOUT_SECONDS,
        ) as smtp:
            if not self.settings.SMTP_USE_SSL and self.settings.SMTP_USE_TLS:
                smtp.starttls()

            if self.settings.SMTP_USERNAME:
                smtp.login(
                    self.settings.SMTP_USERNAME,
                    self.settings.SMTP_PASSWORD,
                )

            smtp.send_message(message)

    @staticmethod
    def _require_atendimento_access(
        current_employee: Employee,
    ) -> None:
        if current_employee.role != Roles.ATENDIMENTO:
            raise HTTPException(
                status_code=HTTPStatus.FORBIDDEN,
                detail='Apenas o atendimento pode emitir faturas de clientes',
            )
