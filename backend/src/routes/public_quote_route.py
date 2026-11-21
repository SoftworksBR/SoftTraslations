from html import escape
from http import HTTPStatus
from typing import Literal

from fastapi import APIRouter, Depends, Form, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_session
from src.services.client_invoice_service import ClientInvoiceService
from src.services.quote_service import QuoteService
from src.settings import Settings

router = APIRouter(
    prefix='/public/quotes',
    tags=['Public Quotes'],
)


def _decision_page(
    title: str,
    message: str,
    *,
    form: str = '',
    status_code: int = 200,
) -> HTMLResponse:
    content = (
        '<!doctype html><html lang="pt-BR"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        f'<title>{escape(title)}</title>'
        '<body style="font:16px Arial,sans-serif;max-width:560px;'
        'margin:64px auto;padding:24px;color:#172b3a">'
        '<h1>SoftTranslations</h1>'
        f'<h2>{escape(title)}</h2><p>{escape(message)}</p>{form}'
        '</body></html>'
    )
    return HTMLResponse(content, status_code=status_code)


@router.get('/{quote_id}/decision', response_class=HTMLResponse)
async def confirm_quote_decision(
    quote_id: int,
    token: str,
    decision: Literal['approve', 'reject'] = Query(),
):
    QuoteService.verify_decision_token(
        token, quote_id, decision, Settings()
    )
    label = 'aprovar' if decision == 'approve' else 'recusar'
    form = (
        f'<form method="post" action="/public/quotes/{quote_id}/decision">'
        f'<input type="hidden" name="token" value="{escape(token)}">'
        f'<input type="hidden" name="decision" value="{decision}">'
        f'<button type="submit">Confirmar e {label} orçamento</button>'
        '</form>'
    )
    return _decision_page(
        'Confirmar decisão',
        f'Deseja realmente {label} este orçamento?',
        form=form,
    )


@router.post('/{quote_id}/decision', response_class=HTMLResponse)
async def submit_quote_decision(
    quote_id: int,
    token: str = Form(),
    decision: Literal['approve', 'reject'] = Form(),
    session: AsyncSession = Depends(get_session),
):
    settings = Settings()
    QuoteService.verify_decision_token(token, quote_id, decision, settings)
    await QuoteService(session, settings).decide_by_client(quote_id, decision)

    if decision == 'reject':
        return _decision_page(
            'Orçamento recusado',
            'Sua decisão foi registrada. Agradecemos pelo retorno.',
        )

    try:
        await ClientInvoiceService(
            session, settings
        ).create_and_email_for_approval(quote_id)
    except HTTPException as error:
        if error.status_code < HTTPStatus.INTERNAL_SERVER_ERROR:
            raise
        return _decision_page(
            'Aprovação registrada',
            'Sua aprovação foi registrada, mas não foi possível enviar a '
            f'fatura automaticamente: {error.detail}',
            status_code=error.status_code,
        )

    return _decision_page(
        'Orçamento aprovado',
        'Sua aprovação foi registrada. A fatura foi enviada para seu e-mail.',
    )
