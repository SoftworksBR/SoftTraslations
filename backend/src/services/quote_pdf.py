from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from src.models.quote_model import Quote


def render_quote_pdf(quote: Quote) -> bytes:
    quote_number = f'ORC-{quote.created_at:%Y%m%d}-{quote.id:06d}'

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title=f'Orçamento {quote_number}',
        author='SoftTranslations',
    )

    base_styles = getSampleStyleSheet()

    styles = {
        'company': ParagraphStyle(
            'Company',
            parent=base_styles['Title'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=25,
            textColor=colors.HexColor('#243B64'),
            alignment=TA_CENTER,
            spaceAfter=4 * mm,
        ),
        'subtitle': ParagraphStyle(
            'Subtitle',
            parent=base_styles['Normal'],
            fontSize=12,
            leading=16,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#555555'),
            spaceAfter=8 * mm,
        ),
        'section': ParagraphStyle(
            'Section',
            parent=base_styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#243B64'),
            spaceBefore=5 * mm,
            spaceAfter=3 * mm,
        ),
        'normal': ParagraphStyle(
            'NormalCustom',
            parent=base_styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=15,
            alignment=TA_LEFT,
        ),
        'label': ParagraphStyle(
            'Label',
            parent=base_styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#555555'),
        ),
        'value': ParagraphStyle(
            'Value',
            parent=base_styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
        ),
        'total': ParagraphStyle(
            'Total',
            parent=base_styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=15,
            leading=20,
            textColor=colors.HexColor('#243B64'),
        ),
        'footer': ParagraphStyle(
            'Footer',
            parent=base_styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#777777'),
            alignment=TA_CENTER,
        ),
    }

    def paragraph(value: object, style: ParagraphStyle) -> Paragraph:
        return Paragraph(escape(str(value)), style)

    def section(title: str) -> list:
        return [
            Spacer(1, 3 * mm),
            paragraph(title, styles['section']),
            HRFlowable(
                width='100%',
                thickness=0.7,
                color=colors.HexColor('#D5DCE8'),
                spaceAfter=3 * mm,
            ),
        ]

    def info_table(rows: list) -> Table:
        table = Table(
            rows,
            colWidths=[38 * mm, 132 * mm],
            hAlign='LEFT',
        )
        table.setStyle(
            TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 2),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                (
                    'LINEBELOW',
                    (0, 0),
                    (-1, -2),
                    0.3,
                    colors.HexColor('#EEEEEE'),
                ),
            ])
        )
        return table

    story = [
        paragraph('SOFTTRANSLATIONS', styles['company']),
        paragraph('ORÇAMENTO DE SERVIÇOS', styles['subtitle']),
        Paragraph(
            f'<b>Número:</b> {escape(quote_number)}'
            f' &nbsp;&nbsp; <b>Emissão:</b> '
            f'{quote.created_at:%d/%m/%Y}',
            styles['normal'],
        ),
        *section('DADOS DO CLIENTE'),
        info_table([
            [
                paragraph('Cliente', styles['label']),
                paragraph(
                    quote.client_name or 'Não informado', styles['value']
                ),
            ],
            [
                paragraph('E-mail', styles['label']),
                paragraph(
                    quote.client_email or 'Não informado', styles['value']
                ),
            ],
        ]),
        *section('DETALHES DO SERVIÇO'),
        info_table([
            [
                paragraph('Serviço', styles['label']),
                paragraph(
                    quote.service_name or 'Não informado', styles['value']
                ),
            ],
            [
                paragraph('Idioma de origem', styles['label']),
                paragraph(
                    quote.source_language_name or 'Não informado',
                    styles['value'],
                ),
            ],
            [
                paragraph('Idioma de destino', styles['label']),
                paragraph(
                    quote.target_language_name or 'Não informado',
                    styles['value'],
                ),
            ],
            [
                paragraph('Prazo de entrega', styles['label']),
                paragraph(
                    quote.deadline.strftime('%d/%m/%Y'),
                    styles['value'],
                ),
            ],
        ]),
        Spacer(1, 7 * mm),
        Table(
            [
                [
                    paragraph('VALOR TOTAL', styles['label']),
                    paragraph(f'R$ {quote.value:.2f}', styles['total']),
                ]
            ],
            colWidths=[85 * mm, 85 * mm],
            style=TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0F3F8')),
                ('BOX', (0, 0), (-1, -1), 0.7, colors.HexColor('#D5DCE8')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]),
        ),
        *section('OBSERVAÇÕES'),
        paragraph(
            quote.observations or 'Nenhuma observação informada.',
            styles['normal'],
        ),
        Spacer(1, 10 * mm),
        paragraph(
            'Para aprovar ou recusar este orçamento, responda a este e-mail.',
            styles['normal'],
        ),
        Spacer(1, 2 * mm),
        paragraph(
            'A aprovação será registrada pela equipe SoftTranslations.',
            styles['normal'],
        ),
        Spacer(1, 8 * mm),
        paragraph(
            'Atenciosamente,<br/>Equipe SoftTranslations', styles['footer']
        ),
    ]

    def draw_footer(canvas, doc) -> None:
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor('#D5DCE8'))
        canvas.line(20 * mm, 15 * mm, A4[0] - 20 * mm, 15 * mm)
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#777777'))
        canvas.drawCentredString(
            A4[0] / 2,
            10 * mm,
            f'SoftTranslations - Orçamento {quote_number} - Página {doc.page}',
        )
        canvas.restoreState()

    document.build(
        story,
        onFirstPage=draw_footer,
        onLaterPages=draw_footer,
    )

    return buffer.getvalue()
