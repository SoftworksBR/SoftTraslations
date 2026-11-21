from datetime import UTC, date, datetime
from email.message import EmailMessage
from email.utils import formataddr
from http import HTTPStatus
from io import BytesIO
from smtplib import SMTP, SMTP_SSL, SMTPException
from typing import Final

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import Roles
from src.models.employee_model import Employee
from src.models.invoice_model import PaymentInvoice
from src.models.stage_model import ProjectStage
from src.schemas.invoice_schema import PaymentInvoiceCreate
from src.settings import Settings

PDF_CONTENT_TYPE: Final = 'application/pdf'


class InvoiceService:
    def __init__(
        self, session: AsyncSession, settings: Settings | None = None
    ):
        self.session = session
        self.settings = settings or Settings()

    async def create_and_email(
        self,
        data: PaymentInvoiceCreate,
        current_employee: Employee,
    ) -> PaymentInvoice:
        self._require_finance_access(current_employee)
        freelancer = await self.session.scalar(
            select(Employee).where(
                Employee.id == data.freelancer_id,
                Employee.role == Roles.FREELANCER,
            )
        )
        if freelancer is None:
            raise HTTPException(
                status_code=HTTPStatus.NOT_FOUND,
                detail='Freelancer not found',
            )
            if data.stage_id is not None:
                stage = await self.session.get(ProjectStage, data.stage_id)
            if stage is None or stage.freelancer_id != freelancer.id:
                raise HTTPException(
                    status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                    detail='Stage is not assigned to this freelancer',
                )

        invoice = PaymentInvoice(
            invoice_number='PENDING',
            freelancer_id=freelancer.id,
            created_by_id=current_employee.id,
            project_id=data.project_id,
            stage_id=data.stage_id,
            description=data.description,
            amount=data.amount,
            issued_on=data.issued_on or date.today(),
        )
        self.session.add(invoice)
        await self.session.flush()
        invoice.invoice_number = (
            f'FAT-{invoice.issued_on:%Y%m%d}-{invoice.id:06d}'
        )
        await self.session.commit()

        try:
            self._send_email(
                recipient=freelancer.email,
                freelancer_name=self._display_name(freelancer),
                invoice=invoice,
            )
        except (OSError, SMTPException) as error:
            raise HTTPException(
                status_code=HTTPStatus.BAD_GATEWAY,
                detail='Invoice created, but email delivery failed',
            ) from error

        invoice.emailed_at = datetime.now(UTC)
        await self.session.commit()
        return invoice

    async def get_pdf(
        self, invoice_id: int, current_employee: Employee
    ) -> tuple[PaymentInvoice, bytes]:
        self._require_finance_access(current_employee)
        invoice = await self.session.scalar(
            select(PaymentInvoice).where(PaymentInvoice.id == invoice_id)
        )
        if invoice is None:
            raise HTTPException(
                status_code=HTTPStatus.NOT_FOUND, detail='Invoice not found'
            )
        return invoice, render_invoice_pdf(invoice)

    @staticmethod
    def _require_finance_access(current_employee: Employee) -> None:
        if current_employee.role not in {Roles.ADMIN, Roles.PROJETOS}:
            raise HTTPException(
                status_code=HTTPStatus.FORBIDDEN,
                detail='Only management can manage payment invoices',
            )

    @staticmethod
    def _display_name(employee: Employee) -> str:
        name = ' '.join(
            part for part in (employee.first_name, employee.last_name) if part
        )
        return name or employee.username

    def _send_email(
        self,
        *,
        recipient: str,
        freelancer_name: str,
        invoice: PaymentInvoice,
    ) -> None:
        if not self.settings.SMTP_HOST or not self.settings.SMTP_FROM_EMAIL:
            raise SMTPException('SMTP email settings are not configured')

        pdf = render_invoice_pdf(invoice)
        message = EmailMessage()
        message['Subject'] = f'Fatura de pagamento {invoice.invoice_number}'
        message['From'] = formataddr(
            (self.settings.SMTP_FROM_NAME, self.settings.SMTP_FROM_EMAIL)
        )
        message['To'] = recipient
        message.set_content(
            f'Olá, {freelancer_name}.\n\n'
            f'Encaminhamos a fatura {invoice.invoice_number} '
            'referente ao seu pagamento.\n'
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
                    self.settings.SMTP_USERNAME, self.settings.SMTP_PASSWORD
                )
            smtp.send_message(message)


def _pdf_escape(value: str) -> str:
    return value.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def render_invoice_pdf(invoice: PaymentInvoice) -> bytes:
    lines = [
        'SOFTTRANSLATIONS',
        f'FATURA DE PAGAMENTO {invoice.invoice_number}',
        f'Data de emissao: {invoice.issued_on:%d/%m/%Y}',
        '',
        f'Descricao: {invoice.description}',
        f'Valor devido: R$ {invoice.amount:.2f}',
    ]
    stream_lines = ['BT', '/F1 12 Tf', '72 760 Td']
    for index, line in enumerate(lines):
        if index:
            stream_lines.append('0 -24 Td')
        stream_lines.append(f'({_pdf_escape(line)}) Tj')
    stream_lines.append('ET')
    stream = '\n'.join(stream_lines).encode('latin-1', errors='replace')
    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] '
        b'/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        b'<< /Length ' + str(len(stream)).encode() + b' >>\nstream\n'
        + stream
        + b'\nendstream',
    ]
    output = BytesIO(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
    output.seek(0, 2)
    offsets = [0]
    for number, body in enumerate(objects, start=1):
        offsets.append(output.tell())
        output.write(f'{number} 0 obj\n'.encode())
        output.write(body)
        output.write(b'\nendobj\n')
    xref_offset = output.tell()
    output.write(f'xref\n0 {len(objects) + 1}\n'.encode())
    output.write(b'0000000000 65535 f \n')
    for offset in offsets[1:]:
        output.write(f'{offset:010d} 00000 n \n'.encode())
    output.write(
        f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n'
        f'startxref\n{xref_offset}\n%%EOF\n'.encode()
    )
    return output.getvalue()
