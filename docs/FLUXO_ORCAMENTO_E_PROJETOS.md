# Fluxo: solicitação → orçamento → projeto

Implementação das tasks do Tiago (entidade no banco + conexão front/back).

```
Cliente (sem login)         Atendimento                    Gestor (projetos)
────────────────────        ───────────────────            ──────────────────
POST /requests/        ──►  GET  /requests/?status=pending
(recebe public_token)       GET  /quotes/suggestion
                            POST /quotes/            (request → quoted)
GET  /requests/public/{t}   PUT  /quotes/{id}        (enquanto em análise)
                            PUT  /quotes/{id}/approve ──► GET /quotes/?available_for_project=true
                            PUT  /quotes/{id}/reject                POST /projects/ {quote_id, path_ids}
                            (request → rejected)
```

## Entidades

| Tabela | Mudança |
|---|---|
| `requests` | + `service_id`, `word_count`, `public_token` (único), `status` (`pending`/`quoted`/`rejected`), `created_at`; `employee_id` agora opcional (o cliente não tem funcionário) |
| `request_files` | + `original_name`; `id` agora autoincrementa |
| `quotes` (nova) | `request_id` (único), `value`, `deadline`, `observations`, `status` (`in_review`/`approved`/`rejected`), `created_by_id`, `approved_by_id`, `approved_at`, `created_at` |
| `projects` | + `quote_id` (único, FK para `quotes`) |

Migration: `backend/alembic/versions/d3f1a7c2b9e4_...py` (parte de `a2016a1cf29e`).

## Endpoints

Públicos (cliente identificado pelo `public_token` devolvido na criação):

- `GET  /requests/options` – idiomas e serviços ativos
- `POST /requests/` – cria solicitação (retorna `public_token`)
- `GET|PUT|DELETE /requests/public/{token}` – acompanhar / editar / excluir (só enquanto `pending`)
- `POST /requests/public/{token}/files` – anexar arquivo (pdf, doc(x), odt, txt, rtf, xls(x), png, jpg; até 10 MB; máx. 10)

Atendimento (`atendimento`; `projetos` só lê):

- `GET /requests/` (filtros: username, email, phone, company, source_language_id, target_language_id, service_id, status), `PUT|DELETE /requests/{id}`, `GET /requests/{id}/files[/{file_id}]`
- `GET /quotes/suggestion?request_id=&word_count=` – preço por palavra × palavras
- `POST /quotes/`, `GET /quotes/` (filtros: status, request_id, client_name, available_for_project), `GET|PUT|DELETE /quotes/{id}`, `PUT /quotes/{id}/approve`, `PUT /quotes/{id}/reject`

Gestor (`projetos`):

- `POST /projects/` aceita `quote_id`; o orçamento precisa estar **aprovado** e sem projeto. O criador é sempre o usuário logado (o `creator_id` enviado é ignorado).

## Regras

- Um orçamento por solicitação. Criar orçamento move a solicitação para `quoted` e a atribui ao atendente.
- Orçamento só pode ser editado/aprovado/recusado/excluído enquanto `in_review`. Recusar marca a solicitação como `rejected`; excluir devolve a solicitação para `pending`.
- Solicitação com orçamento não pode ser excluída nem editada pelo cliente.
- Todo projeto continua exigindo ao menos uma trilha (`path_ids`).

## Front (`Front-Geral`)

- `services/` – `requests.ts`, `quotes.ts`, `projects.ts`, `dialog.ts`, `storage.ts`, `employees.ts`
- Cliente: `orcamentos/FazerSolicitacao`, `orcamentos/MinhasSolicitacoes` (tokens guardados em `localStorage` na web)
- Atendente: `atendente/requisicoes`, `atendente/novo-orcamento`, `atendente/orcamentos`
- Gestor: `gestor/orcamentos` (aprovados sem projeto), `gestor/novo-projeto`, `gestor/projetos`
- Login real (`/auth/` + `/auth/me`) com redirecionamento por cargo; logout nos três menus

## Como validar

```bash
cd backend
uv sync && uv run alembic upgrade head
uv run pytest                                   # testes unitários
# fluxo completo contra um Postgres descartável:
PYTHONPATH=. uv run python scripts/smoke_fluxo_orcamento.py
```
