# Backend do SoftTranslations

API REST desenvolvida com FastAPI, SQLAlchemy assíncrono e PostgreSQL. A configuração detalhada do ambiente local, incluindo o frontend, está no [Manual de Instalação](../docs/instalation_manual.md).

## Requisitos

- Python 3.13 ou superior;
- `uv`;
- PostgreSQL;
- ReportLab para geração de documentos PDF;
- MongoDB opcional para persistir logs e entregar eventos da outbox;
- Chave de API do Google Gemini para utilizar o Assistente Público;
- Conta de e-mail com suporte a SMTP para envio de documentos.

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

O administrador inicial é criado na inicialização somente quando o banco ainda não contém funcionários. As variáveis `INITIAL_ADMIN_*` não redefinem uma conta existente. Consulte `backend/.env.example` para ver as configurações adicionais de autenticação, CORS, uploads, SMTP e MongoDB.

## Configuração de e-mail (SMTP)

O backend utiliza SMTP para enviar documentos por e-mail. Essa integração é utilizada tanto no envio de faturas de pagamento quanto no envio de orçamentos aos clientes.

As configurações são carregadas pelo módulo `src/settings.py` e devem ser definidas no arquivo `backend/.env`.

Exemplo de configuração utilizando Gmail:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seuemail@gmail.com
SMTP_PASSWORD=sua_senha_de_aplicativo
SMTP_FROM_EMAIL=seuemail@gmail.com
SMTP_FROM_NAME=SoftTranslations
SMTP_USE_TLS=true
SMTP_USE_SSL=false
SMTP_TIMEOUT_SECONDS=20
```

As variáveis possuem as seguintes finalidades:

- `SMTP_HOST`: endereço do servidor SMTP.
- `SMTP_PORT`: porta utilizada na conexão.
- `SMTP_USERNAME`: usuário utilizado na autenticação.
- `SMTP_PASSWORD`: senha ou senha de aplicativo do serviço de e-mail.
- `SMTP_FROM_EMAIL`: endereço utilizado como remetente.
- `SMTP_FROM_NAME`: nome exibido como remetente.
- `SMTP_USE_TLS`: habilita STARTTLS na conexão SMTP.
- `SMTP_USE_SSL`: habilita conexão SMTP com SSL.
- `SMTP_TIMEOUT_SECONDS`: tempo limite da conexão.

Para utilizar o Gmail, é necessário habilitar a verificação em duas etapas e gerar uma senha de aplicativo pela página de [Senhas de app do Google](https://myaccount.google.com/apppasswords).

**Importante:**

- Não utilize a senha normal do Gmail quando a conta exigir senha de aplicativo.
- Não versione o arquivo `.env`.
- Não compartilhe credenciais SMTP.
- Após modificar as configurações, reinicie o backend.

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

## Orçamentos em PDF e envio por e-mail

O backend permite gerar documentos PDF com os dados dos orçamentos e enviá-los diretamente aos clientes por e-mail.

A funcionalidade utiliza o ReportLab para gerar os documentos e a configuração SMTP para realizar os envios.

### Geração do PDF

A geração dos documentos é realizada pelo módulo:

`src/services/quote_pdf.py`

O documento contém:

- Número identificador do orçamento;
- Data de emissão;
- Nome e e-mail do cliente;
- Serviço solicitado;
- Idiomas de origem e destino;
- Valor total;
- Prazo de entrega;
- Observações.

O PDF é gerado em memória utilizando `BytesIO`, sem necessidade de armazenar arquivos temporários no servidor.

### Envio do orçamento

A regra de negócio está implementada em:

`src/services/quote_service.py`

O fluxo de envio funciona da seguinte maneira:

1. O atendente solicita o envio do orçamento.
2. O backend verifica a permissão do funcionário.
3. O sistema recupera os dados do orçamento e do cliente.
4. O PDF é gerado utilizando o ReportLab.
5. O documento é anexado ao e-mail.
6. O e-mail é enviado ao endereço cadastrado na solicitação do cliente.

O destinatário é obtido pelo e-mail associado à solicitação (`Request.email`).

### Endpoint

O envio é realizado pelo seguinte endpoint:

**POST** `/quotes/{quote_id}/send-email`

Exemplo de requisição:

```http
POST /quotes/1/send-email
```

A operação exige autenticação e permissão de um funcionário com perfil `atendimento`.

Em caso de sucesso, o endpoint retorna uma mensagem de confirmação e o endereço do destinatário.

### Regras de negócio

- O envio está disponível para orçamentos com status `in_review`.
- Apenas funcionários com perfil `atendimento` podem solicitar o envio.
- O envio não altera o status do orçamento.
- O envio não aprova nem recusa automaticamente a proposta.
- O cliente pode responder ao e-mail informando sua decisão.
- A equipe de atendimento registra manualmente a aprovação ou recusa utilizando as operações existentes.
- É permitido reenviar o orçamento enquanto ele permanecer em análise.

**Importante:** o sistema não realiza leitura automática das respostas recebidas por e-mail. A decisão do cliente continua sendo registrada manualmente pelo atendente.

### Tratamento de erros

Caso ocorra uma falha durante a comunicação com o servidor SMTP, o backend retorna HTTP `502 Bad Gateway`, informando que o orçamento foi criado, mas o envio do e-mail falhou.

Verifique as configurações SMTP e os logs do backend para identificar a causa.

## Faturas de pagamento

O backend também permite criar e enviar faturas de pagamento aos freelancers.

A implementação está localizada em:

`src/services/invoice_service.py`

A geração do documento PDF e o envio por e-mail são realizados pelo serviço de faturas, utilizando as configurações SMTP do ambiente.

### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/payment-invoices/` | Cria uma fatura e envia o documento por e-mail ao freelancer. |
| GET | `/payment-invoices/{id}/pdf` | Disponibiliza o PDF da fatura para download. |

A migração `20261110_invoice` cria a tabela de faturas. Aplique as migrações com:

```bash
alembic upgrade head
```

As faturas de pagamento e os orçamentos possuem fluxos independentes, embora compartilhem as configurações SMTP do backend.

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
│   │   ├── quote_pdf.py
│   │   ├── quote_service.py
│   │   └── invoice_service.py
│   ├── repositories/ # Acesso a dados, quando aplicável
│   ├── models/       # Modelos SQLAlchemy
│   ├── schemas/      # Validação e serialização
│   ├── database.py
│   ├── security.py
│   ├── settings.py
│   └── main.py
└── tests/            # Testes automatizados
```

As rotas expõem a API, schemas validam os dados de entrada e saída, models representam os registros persistidos e services concentram regras do domínio e integrações externas.

Migrações versionadas do PostgreSQL ficam em `alembic/versions/`.
