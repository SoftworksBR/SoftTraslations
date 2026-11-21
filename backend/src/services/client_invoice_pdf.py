from io import BytesIO

from src.models.client_invoice_model import ClientInvoice


def _pdf_escape(value: str) -> str:
    return (
        value.replace('\\', '\\\\')
        .replace('(', '\\(')
        .replace(')', '\\)')
    )


def render_client_invoice_pdf(invoice: ClientInvoice) -> bytes:
    lines = [
        'SOFTTRANSLATIONS',
        'FATURA DE SERVICO',
        '',
        f'Numero: {invoice.invoice_number}',
        f'Data de emissao: {invoice.issued_on:%d/%m/%Y}',
        '',
        f'Cliente: {invoice.client_name}',
        f'E-mail: {invoice.client_email}',
        '',
        f'Descricao: {invoice.description}',
        f'Valor total: R$ {invoice.amount:.2f}',
        '',
        'Obrigado por escolher a SoftTranslations!',
    ]

    stream_lines = ['BT', '/F1 12 Tf', '72 760 Td']

    for index, line in enumerate(lines):
        if index:
            stream_lines.append('0 -24 Td')

        stream_lines.append(f'({_pdf_escape(line)}) Tj')

    stream_lines.append('ET')

    stream = '\n'.join(stream_lines).encode(
        'latin-1',
        errors='replace',
    )

    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        (
            b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] '
            b'/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>'
        ),
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        (
            b'<< /Length '
            + str(len(stream)).encode()
            + b' >>\nstream\n'
            + stream
            + b'\nendstream'
        ),
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
