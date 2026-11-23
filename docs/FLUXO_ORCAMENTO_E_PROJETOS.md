# Referência técnica: solicitação → orçamento → projeto

Este documento resume o fluxo implementado na API, seus registros e permissões.
Para instruções operacionais das telas e limitações conhecidas da interface,
consulte o [Manual do Usuário](./user_manual.md). Os endpoints públicos com
token existem na API, mas nem todos têm uma tela correspondente no frontend.

```
Cliente (sem login)             Atendimento                    Gestor (projetos)
────────────────────            ───────────────────            ──────────────────
POST /requests/            ──►  GET  /requests/?status=pending
(recebe public_token)           GET  /quotes/suggestion
                                POST /quotes/ (envia orçamento)
GET /requests/public/{t}        PUT  /quotes/{id} (em análise)
E-mail: aprovar/recusar ─────►  decisão do cliente
aprovação envia fatura ─────►  GET /quotes/?available_for_project=true
                                                              POST /projects/ {quote_id, path_ids}
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
- `GET /public/quotes/{id}/decision` – confirma a decisão com o token assinado; a confirmação é enviada por `POST`.

Atendimento (`atendimento`; `projetos` só lê):

- `GET /requests/` (filtros: username, email, phone, company, source_language_id, target_language_id, service_id, status), `PUT|DELETE /requests/{id}`, `GET /requests/{id}/files[/{file_id}]`
- `POST /requests/{id}/files` – o atendimento anexa documento (mesmos limites do envio público) enquanto a solicitação está `pending` ou o orçamento está `in_review`; nos demais casos responde `409`
- `GET /quotes/suggestion?request_id=&word_count=` – preço por palavra × palavras
- `POST /quotes/` cria e envia o orçamento por e-mail; `GET /quotes/` (filtros: status, request_id, client_name, available_for_project), `GET|PUT|DELETE /quotes/{id}`.

Gestor (`projetos`):

- `POST /projects/` aceita `quote_id`; o orçamento precisa estar **aprovado** e sem projeto. O criador é sempre o usuário logado (o `creator_id` enviado é ignorado).

## Regras

- Um orçamento por solicitação. Criar orçamento move a solicitação para `quoted` e a atribui ao atendente.
- Orçamento só pode ser editado/decidido/excluído enquanto `in_review`. Recusar marca a solicitação como `rejected`; excluir devolve a solicitação para `pending`.
- Solicitação com orçamento não pode ser excluída nem editada pelo cliente.
- Na edição do orçamento (`in_review`), o atendente pode anexar documentos à solicitação. Alterar o orçamento ou anexar documentos não reenvia o e-mail: se o cliente já recebeu o orçamento, o atendente deve reenviá-lo (`POST /quotes/{id}/send-email`) depois de salvar.
- Todo projeto continua exigindo ao menos uma trilha (`path_ids`).

## Front (`Front-Geral`)

- `services/` – `requests.ts`, `quotes.ts`, `projects.ts`, `dialog.ts`, `storage.ts`, `employees.ts`
- Cliente: `orcamentos/FazerSolicitacao` envia solicitação e anexos; a tela
  `orcamentos/MinhasSolicitacoes` atualmente redireciona para o formulário.
  Portanto, a interface ainda não persiste o token público nem oferece
  acompanhamento, edição ou exclusão da solicitação pelo cliente.
- Atendente: `atendente/requisicoes`, `atendente/novo-orcamento`, `atendente/orcamentos`. Em `novo-orcamento`, no modo edição (`quoteId`), aparecem os documentos da solicitação, o botão **Anexar documento** e o aviso para reenviar o e-mail ao cliente.
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
