# Backend do SoftTranslations

API REST desenvolvida com FastAPI, SQLAlchemy assíncrono e PostgreSQL. A configuração detalhada do ambiente local, incluindo o frontend, está no [Manual de Instalação](../docs/instalation_manual.md).

## Requisitos

- Python 3.13 ou superior;
- `uv`;
- PostgreSQL;
- MongoDB opcional para persistir logs e entregar eventos da outbox;
- Chave de API do Google Gemini para utilizar o Assistente Público.

Sem MongoDB, a API continua funcionando, mas os logs não são persistidos e os eventos da outbox ficam pendentes.

## Preparar e iniciar

Na raiz do repositório:

```powershell
cd backend
uv sync
Copy-Item .env.example .env
```

No Linux, use `cp .env.example .env` no lugar de `Copy-Item`. Edite `.env` e configure `DATABASE_URL`, `SECRET_KEY` e as credenciais `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD`. Crie o banco `soft_translations_db` antes de aplicar as migrações.

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

A API escuta na porta `8000`; a documentação interativa está em:

- [Swagger UI](http://localhost:8000/docs)
- [ReDoc](http://localhost:8000/redoc)

O administrador inicial é criado na inicialização somente quando o banco ainda não contém funcionários. As variáveis `INITIAL_ADMIN_*` não redefinem uma conta existente. Consulte `backend/.env.example` para ver as configurações adicionais de autenticação, CORS, uploads e MongoDB.

## Assistente Público — Google Gemini

O backend disponibiliza um assistente virtual para visitantes da página pública do SoftTranslations. Ele utiliza o Google Gemini por meio do Google ADK para responder perguntas sobre os serviços de tradução, idiomas disponíveis e estimativas de preços.

### Configuração

Para habilitar o assistente, configure a variável `GOOGLE_API_KEY` no arquivo `backend/.env`.

```env
GOOGLE_API_KEY=sua_chave_api_google
```

A chave pode ser obtida pelo [Google AI Studio](https://aistudio.google.com/apikey).

**Importante:**

- A chave deve permanecer exclusivamente no backend.
- Não exponha a chave em variáveis do frontend, como `EXPO_PUBLIC_*`.
- Não versione o arquivo `.env` nem compartilhe credenciais.
- Reinicie o backend após modificar a configuração.

### Endpoint

O assistente disponibiliza o seguinte endpoint público:

**POST** `/public/assistant/chat`

Endereço local:

`http://localhost:8000/public/assistant/chat`

Exemplo de requisição:

```json
{
  "message": "Quais serviços de tradução estão disponíveis?",
  "session_id": null
}
```

Exemplo ilustrativo de resposta:

```json
{
  "session_id": "identificador-da-sessao",
  "response": "Temos diferentes serviços de tradução disponíveis..."
}
```

### Sessões de conversa

O campo `session_id` identifica a sessão de conversa.

- Na primeira mensagem, pode ser enviado como `null`.
- O backend cria um identificador quando uma nova sessão é iniciada.
- Nas mensagens seguintes, o frontend envia o identificador retornado para manter o contexto da conversa.

As sessões são gerenciadas pelo serviço de sessão em memória do Google ADK. Elas não representam um histórico permanente de conversas.

### Ferramentas do agente

O agente possui ferramentas para consultar informações do sistema:

- **Consulta de serviços:** obtém os serviços de tradução ativos.
- **Consulta de idiomas:** obtém os idiomas disponíveis e ativos.
- **Estimativa de preços:** consulta os preços cadastrados considerando o serviço e os idiomas selecionados.

As estimativas são informativas e utilizam os dados cadastrados no sistema. O assistente não cria automaticamente um orçamento formal nem substitui o processo de elaboração de propostas comerciais.

### Tratamento de erros

A rota pode retornar HTTP `503 Service Unavailable` quando ocorre uma falha de configuração ou execução do serviço do assistente.

Em caso de falha:

1. Confira se `GOOGLE_API_KEY` está configurada no `backend/.env`.
2. Verifique se a chave é válida.
3. Confirme se o backend consegue acessar os serviços do Google.
4. Consulte os logs da aplicação para identificar a causa.

## Faturas de pagamento

Para criar e enviar faturas de pagamento aos freelancers, configure também `SMTP_HOST`, `SMTP_FROM_EMAIL` e as demais variáveis `SMTP_*` no `.env`.

A migração `20261110_invoice` cria a tabela de faturas; aplique-a com `alembic upgrade head`.

O endpoint `POST /payment-invoices/` cria a fatura, gera o PDF e o envia como anexo ao e-mail do freelancer. O PDF também pode ser baixado por `GET /payment-invoices/{id}/pdf`.

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

O comando de teste executa o lint e gera o relatório HTML de cobertura. Para executar somente a suíte de testes, use `uv run pytest`; para executar somente o lint, use `uv run ruff check`.

## Organização do código

```text
backend/
├── alembic/          # Migrações do PostgreSQL
├── scripts/          # Scripts de validação e suporte
├── src/
│   ├── agents/       # Agentes de IA
│   ├── routes/       # Endpoints HTTP
│   ├── controllers/  # Fluxo de entrada/saída das requisições
│   ├── services/     # Regras de negócio e integrações
│   ├── repositories/ # Acesso a dados, quando aplicável
│   ├── models/       # Modelos SQLAlchemy
│   ├── schemas/      # Validação e serialização
│   ├── database.py
│   ├── security.py
│   ├── settings.py
│   └── main.py
└── tests/            # Testes automatizados
```

As rotas expõem a API, schemas validam os dados de entrada/saída, models representam os registros persistidos e services concentram regras do domínio. Migrações versionadas do PostgreSQL ficam em `alembic/versions/`.