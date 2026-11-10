# Backend do SoftTranslations

API REST desenvolvida com FastAPI, SQLAlchemy assíncrono e PostgreSQL. A
configuração detalhada do ambiente local, incluindo o frontend, está no
[Manual de Instalação](../docs/instalation_manual.md).

## Requisitos

- Python 3.13 ou superior;
- `uv`;
- PostgreSQL;
- MongoDB opcional para persistir logs e entregar eventos da outbox.

Sem MongoDB, a API continua funcionando, mas os logs não são persistidos e os
eventos da outbox ficam pendentes.

## Preparar e iniciar

Na raiz do repositório:

```powershell
cd backend
uv sync
Copy-Item .env.example .env
```

No Linux, use `cp .env.example .env` no lugar de `Copy-Item`. Edite `.env` e
configure `DATABASE_URL`, `SECRET_KEY` e as credenciais
`INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD`.
Crie o banco `soft_translations_db` antes de aplicar as migrações.

Ative o ambiente virtual e execute as migrações:

```powershell
.\.venv\Scripts\Activate.ps1
alembic upgrade head
```

No Linux, a ativação equivalente é:

```bash
source .venv/bin/activate
alembic upgrade head
```

Inicie o servidor de desenvolvimento:

```text
task run
```

A API escuta na porta `8000`; a documentação interativa está em
`http://localhost:8000/docs` e `http://localhost:8000/redoc`.

O administrador inicial é criado na inicialização somente quando o banco ainda
não contém funcionários. As variáveis `INITIAL_ADMIN_*` não redefinem uma
conta existente. Consulte `backend/.env.example` para ver as configurações
adicionais de autenticação, CORS, uploads e MongoDB.

Para criar e enviar faturas de pagamento aos freelancers, configure também
`SMTP_HOST`, `SMTP_FROM_EMAIL` e as demais variáveis `SMTP_*` no `.env`.
A migração `20261110_invoice` cria a tabela de faturas; aplique-a com
`alembic upgrade head`. O endpoint `POST /payment-invoices/` cria a fatura,
gera o PDF e o envia como anexo ao e-mail do freelancer. O PDF também pode
ser baixado por `GET /payment-invoices/{id}/pdf`.

## Testes e qualidade

Com o ambiente virtual ativo:

```text
task test
```

O comando de teste executa o lint e gera o relatório HTML de cobertura. Para
executar somente a suíte de testes, use `uv run pytest`; para executar somente
o lint, use `uv run ruff check`.

## Organização do código

```text
backend/
├── alembic/       # Migrações do PostgreSQL
├── scripts/       # Scripts de validação e suporte
├── src/
│   ├── routes/    # Endpoints HTTP
│   ├── controllers/# Fluxo de entrada/saída das requisições
│   ├── services/  # Regras de negócio e integrações
│   ├── repositories/ # Acesso a dados, quando aplicável
│   ├── models/    # Modelos SQLAlchemy
│   ├── schemas/   # Validação e serialização
│   ├── database.py
│   ├── security.py
│   ├── settings.py
│   └── main.py
└── tests/         # Testes automatizados
```

As rotas expõem a API, schemas validam os dados de entrada/saída, models
representam os registros persistidos e services concentram regras do domínio.
Migrações versionadas do PostgreSQL ficam em `alembic/versions/`.
