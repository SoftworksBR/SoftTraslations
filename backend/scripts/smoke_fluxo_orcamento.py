# ruff: noqa
"""Teste ponta a ponta do fluxo solicitação -> orçamento -> projeto.

Roda contra um Postgres real (use um banco descartável!):

    DATABASE_URL=postgresql+asyncpg://... uv run alembic upgrade head
    DATABASE_URL=... SECRET_KEY=x ALGORITHM=HS256 \
        uv run python scripts/smoke_fluxo_orcamento.py
"""

import io
import uuid

from fastapi.testclient import TestClient

from src.main import app


def check(cond, msg):
    print(('OK   ' if cond else 'FALHOU ') + msg)
    if not cond:
        raise SystemExit(1)


class Actor:
    """Cliente HTTP com cookie próprio, mas compartilhando um único loop."""

    def __init__(self, client):
        self.client = client
        self.cookies = {}

    def _call(self, method, *args, **kwargs):
        self.client.cookies.clear()
        for name, value in self.cookies.items():
            self.client.cookies.set(name, value)
        response = getattr(self.client, method)(*args, **kwargs)
        if 'set-cookie' in response.headers:
            self.cookies = dict(self.client.cookies)
        return response

    def get(self, *a, **k):
        return self._call('get', *a, **k)

    def post(self, *a, **k):
        return self._call('post', *a, **k)

    def put(self, *a, **k):
        return self._call('put', *a, **k)

    def delete(self, *a, **k):
        return self._call('delete', *a, **k)


suffix = uuid.uuid4().hex[:6]
_http = TestClient(app)
_http.__enter__()  # um único event loop para todos os atores
admin, atendente, gestor, cliente = (Actor(_http) for _ in range(4))

# --- admin e funcionários ---------------------------------------------
r = admin.post('/auth/register-admin')
if r.status_code not in (201, 409):
    print(r.status_code, r.text)
r = admin.post(
    '/auth/', data={'username': 'admin@admin.com', 'password': 'admin123'}
)
check(r.status_code == 200, 'login admin')

for client, role in ((atendente, 'atendimento'), (gestor, 'projetos')):
    email = f'{role}{suffix}@teste.com'
    r = admin.post(
        '/employee/',
        json={
            'username': f'{role}{suffix}',
            'email': email,
            'role': role,
            'password': 'senha12345',
        },
    )
    check(r.status_code == 201, f'cria funcionário {role}: {r.text[:80]}')
    r = client.post(
        '/auth/', data={'username': email, 'password': 'senha12345'}
    )
    check(r.status_code == 200, f'login {role}')

# --- trilha (todo projeto precisa de ao menos uma) -----------------------
r = gestor.post(
    '/employee/',
    json={
        'username': f'free{suffix}',
        'email': f'free{suffix}@teste.com',
        'role': 'freelancer',
        'password': 'senha12345',
    },
)
check(r.status_code == 201, f'cria freelancer {r.text[:80]}')
r = gestor.post(
    '/stages/',
    json={'freelancer_id': r.json()['id'], 'name': 'Revisão', 'status': 'ready'},
)
check(r.status_code == 201, f'cria etapa {r.text[:80]}')
r = gestor.post('/paths/', json={'name': f'Trilha {suffix}', 'stage_ids': [r.json()['id']]})
check(r.status_code == 201, f'cria trilha {r.text[:80]}')
PATH_ID = r.json()['id']

# --- catálogo (admin) --------------------------------------------------
pt = admin.post('/idiomas', json={'name': f'Português{suffix}', 'code': f'p{suffix}'})
en = admin.post('/idiomas', json={'name': f'Inglês{suffix}', 'code': f'e{suffix}'})
sv = admin.post('/servicos', json={'name': f'Juramentada{suffix}'})
check(
    pt.status_code == en.status_code == sv.status_code == 201,
    f'cria idiomas/serviço {pt.status_code} {en.status_code} {sv.status_code}',
)
pt, en, sv = pt.json(), en.json(), sv.json()
r = admin.post(
    '/precos-traducao',
    json={
        'service_id': sv['id'],
        'source_language_id': pt['id'],
        'target_language_id': en['id'],
        'price_per_word': '0.5',
    },
)
check(r.status_code == 201, f'cria preço {r.text[:80]}')

# --- cliente: opções públicas e solicitação ----------------------------
r = cliente.get('/requests/options')
check(r.status_code == 200, 'opções públicas sem login')
check(
    any(i['id'] == pt['id'] for i in r.json()['languages'])
    and any(i['id'] == sv['id'] for i in r.json()['services']),
    'opções trazem idiomas e serviços ativos',
)

payload = {
    'username': 'Cliente Teste',
    'email': 'cliente@teste.com',
    'phone': '(12) 99999-0000',
    'company': 'ACME',
    'source_language_id': pt['id'],
    'target_language_id': en['id'],
    'service_id': sv['id'],
    'observations': 'Urgente',
    'word_count': 1000,
}
r = cliente.post('/requests/', json={**payload, 'target_language_id': pt['id']})
check(r.status_code == 422, 'rejeita idiomas iguais')
r = cliente.post('/requests/', json={**payload, 'email': 'invalido'})
check(r.status_code == 422, 'rejeita e-mail inválido')
r = cliente.post('/requests/', json={**payload, 'service_id': 99999})
check(r.status_code == 422, 'rejeita serviço inexistente')

r = cliente.post('/requests/', json=payload)
check(r.status_code == 201, f'cria solicitação {r.text[:100]}')
req = r.json()
token = req['public_token']
check(req['status'] == 'pending' and req['service_name'], 'status pending + nomes')

r = cliente.put(f'/requests/public/{token}', json={'observations': 'Mudou'})
check(r.status_code == 200 and r.json()['observations'] == 'Mudou', 'cliente edita')

r = cliente.post(
    f'/requests/public/{token}/files',
    files={'file': ('contrato.pdf', io.BytesIO(b'%PDF-1.4 teste'), 'application/pdf')},
)
check(r.status_code == 201, f'upload pdf {r.text[:80]}')
r = cliente.post(
    f'/requests/public/{token}/files',
    files={'file': ('virus.exe', io.BytesIO(b'MZ'), 'application/octet-stream')},
)
check(r.status_code == 422, 'rejeita extensão .exe')
r = cliente.get(f'/requests/public/{token}')
check(len(r.json()['files']) == 1 and r.json()['quote'] is None, 'consulta pública com arquivo')
check(cliente.get('/requests/public/token-invalido').status_code == 404, 'token inválido 404')
check(cliente.get('/requests/').status_code == 401, 'listagem interna exige login')

# --- atendente: lista, sugere, orça, aprova ---------------------------
r = atendente.get('/requests/', params={'status': 'pending'})
check(r.status_code == 200 and any(x['id'] == req['id'] for x in r.json()), 'atendente lista pendentes')
r = atendente.get(f"/requests/{req['id']}/files")
fid = r.json()[0]['id']
r = atendente.get(f"/requests/{req['id']}/files/{fid}")
check(r.status_code == 200 and r.content.startswith(b'%PDF'), 'atendente baixa arquivo')

r = atendente.get('/quotes/suggestion', params={'request_id': req['id']})
check(r.json()['suggested_value'] == 500.0, f"sugestão 1000 x 0.5 = {r.json()}")
r = atendente.get('/quotes/suggestion', params={'request_id': req['id'], 'word_count': 333})
check(r.json()['suggested_value'] == 166.5, 'sugestão com word_count')

r = gestor.post('/quotes/', json={'request_id': req['id'], 'value': '500', 'deadline': '2026-12-01'})
check(r.status_code == 403, 'gestor não cria orçamento')
r = atendente.post('/quotes/', json={'request_id': req['id'], 'value': '-1', 'deadline': '2026-12-01'})
check(r.status_code == 422, 'valor negativo rejeitado')
r = atendente.post('/quotes/', json={'request_id': req['id'], 'value': '500.00', 'deadline': '2026-12-01', 'observations': 'ok'})
check(r.status_code == 201, f'cria orçamento {r.text[:100]}')
quote = r.json()
check(quote['status'] == 'in_review' and quote['client_name'] == 'Cliente Teste', 'orçamento em análise com dados do cliente')
r = atendente.post('/quotes/', json={'request_id': req['id'], 'value': '1', 'deadline': '2026-12-01'})
check(r.status_code == 409, 'segundo orçamento da mesma solicitação 409')

r = cliente.get(f'/requests/public/{token}')
check(r.json()['status'] == 'quoted' and r.json()['quote']['value'] == 500.0, 'cliente vê orçamento')
r = cliente.put(f'/requests/public/{token}', json={'observations': 'x'})
check(r.status_code == 409, 'cliente não edita após orçamento')
r = cliente.delete(f'/requests/public/{token}')
check(r.status_code == 409, 'cliente não exclui após orçamento')

r = atendente.put(f"/quotes/{quote['id']}", json={'value': '650.50'})
check(r.status_code == 200 and r.json()['value'] == 650.5, 'edita valor enquanto em análise')

# --- gestor: só projeto de orçamento aprovado --------------------------
r = gestor.post('/projects/', json={'name': 'P1', 'quote_id': quote['id'], 'path_ids': [PATH_ID]})
check(r.status_code == 409, 'projeto de orçamento não aprovado 409')

r = gestor.put(f"/quotes/{quote['id']}/approve")
check(r.status_code == 403, 'gestor não aprova')
r = atendente.put(f"/quotes/{quote['id']}/approve")
check(r.status_code == 200 and r.json()['status'] == 'approved' and r.json()['approved_at'], 'atendente aprova')
r = atendente.put(f"/quotes/{quote['id']}", json={'value': '1'})
check(r.status_code == 409, 'não edita orçamento aprovado')

r = gestor.get('/quotes/', params={'available_for_project': 'true'})
check(r.status_code == 200 and any(q['id'] == quote['id'] for q in r.json()), 'gestor lista aprovados sem projeto')

r = gestor.post('/projects/', json={'name': 'Projeto ACME', 'quote_id': quote['id'], 'creator_id': 999, 'path_ids': [PATH_ID]})
check(r.status_code == 201, f'gestor cria projeto {r.text[:120]}')
proj = r.json()
check(len(proj['paths']) == 1 and proj['quote_id'] == quote['id'] and proj['creator_id'] != 999 and proj['status'] == 'ready', 'creator vem do login; quote vinculado')
r = gestor.post('/projects/', json={'name': 'Duplicado', 'quote_id': quote['id'], 'path_ids': [PATH_ID]})
check(r.status_code == 409, 'segundo projeto do mesmo orçamento 409')
r = gestor.get('/quotes/', params={'available_for_project': 'true'})
check(not any(q['id'] == quote['id'] for q in r.json()), 'orçamento sai da lista de disponíveis')

# --- recusa: segundo cliente -------------------------------------------
r = cliente.post('/requests/', json=payload)
t2, id2 = r.json()['public_token'], r.json()['id']
q2 = atendente.post('/quotes/', json={'request_id': id2, 'value': '10', 'deadline': '2026-12-02'}).json()
r = atendente.put(f"/quotes/{q2['id']}/reject")
check(r.json()['status'] == 'rejected', 'rejeita orçamento')
check(cliente.get(f'/requests/public/{t2}').json()['status'] == 'rejected', 'solicitação vira rejected')

# --- exclusão de orçamento volta a pendente ----------------------------
r = cliente.post('/requests/', json=payload)
id3 = r.json()['id']
q3 = atendente.post('/quotes/', json={'request_id': id3, 'value': '10', 'deadline': '2026-12-02'}).json()
check(atendente.delete(f"/quotes/{q3['id']}").status_code == 204, 'exclui orçamento em análise')
r = atendente.get('/requests/', params={'status': 'pending'})
check(any(x['id'] == id3 for x in r.json()), 'solicitação volta a pendente')
check(atendente.delete(f'/requests/{id3}').status_code == 204, 'atendente exclui solicitação sem orçamento')
check(atendente.delete(f"/requests/{req['id']}").status_code == 409, 'não exclui solicitação com orçamento')
print('\nTODOS OS CENÁRIOS PASSARAM')
