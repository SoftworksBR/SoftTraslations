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

O backend utiliza SMTP para enviar documentos por e-mail. Essa integração é compartilhada pelos seguintes recursos:

- Envio de orçamentos em PDF aos clientes;
- Envio de faturas de clientes geradas a partir de orçamentos aprovados;
- Envio de faturas de pagamento aos freelancers.

Todos utilizam as mesmas configurações SMTP definidas no ambiente.

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
PUBLIC_API_URL=https://api.seudominio.com
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
- `PUBLIC_API_URL`: endereço público da API usado nos botões de decisão do orçamento.

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

O backend gera o PDF do orçamento e o envia automaticamente ao cliente quando
o orçamento é criado. O e-mail contém botões de aprovação e recusa; cada botão
abre uma confirmação pública protegida por token assinado. A decisão é
registrada somente após o cliente confirmar no navegador.

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

1. O atendimento cria o orçamento.
2. O sistema recupera os dados do orçamento e do cliente.
3. O PDF é gerado utilizando o ReportLab.
4. O e-mail inclui botões com links assinados para aprovar ou recusar.
5. O documento é anexado e enviado ao endereço cadastrado na solicitação.
6. Ao aprovar, o cliente confirma a ação na página pública e o sistema envia a
   fatura automaticamente.

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

- O envio automático ocorre na criação; o botão de reenvio está disponível
  enquanto o orçamento estiver `in_review`.
- Apenas funcionários com perfil `atendimento` podem solicitar o envio.
- O envio não altera o status do orçamento.
- O envio não aprova nem recusa automaticamente a proposta.
- A decisão só é registrada após a confirmação do cliente na página aberta
  pelo link do e-mail.
- Os links são assinados e expiram após 30 dias.
- A aprovação cria e envia a fatura automaticamente; cada orçamento pode ter
  apenas uma fatura.

Defina `PUBLIC_API_URL` como o endereço público acessível pelos clientes. O
valor padrão `http://localhost:8000` é destinado somente ao desenvolvimento
local.

### Tratamento de erros

Caso ocorra uma falha durante a comunicação com o servidor SMTP, o backend retorna HTTP `502 Bad Gateway`, informando que o orçamento foi criado, mas o envio do e-mail falhou.

Verifique as configurações SMTP e os logs do backend para identificar a causa.

## Faturas de clientes

O backend permite gerar faturas em PDF para clientes a partir de orçamentos aprovados e enviar esses documentos automaticamente por e-mail.

Essa funcionalidade é independente das faturas de pagamento destinadas aos freelancers.

### Implementação

A funcionalidade está organizada nos seguintes módulos:

- `src/models/client_invoice_model.py`: modelo e persistência das faturas de clientes;
- `src/schemas/client_invoice_schema.py`: schemas de entrada e resposta;
- `src/repositories/client_invoice_repository.py`: operações de acesso aos registros;
- `src/controllers/client_invoice_controller.py`: intermediação entre a rota e o serviço;
- `src/routes/client_invoice_route.py`: endpoint HTTP;
- `src/services/client_invoice_service.py`: regras de negócio, geração e envio;
- `src/services/client_invoice_pdf.py`: geração do documento PDF.

O PDF é gerado em memória utilizando `BytesIO`, sem necessidade de armazenar arquivos temporários no servidor.

### Endpoint

A emissão e o envio são realizados pelo endpoint:

**POST** `/client-invoices/{quote_id}/send-email`

Exemplo:

```http
POST /client-invoices/1/send-email
```

A operação exige autenticação e permissão de um funcionário com perfil `atendimento`.

### Fluxo de funcionamento

1. O cliente aprova o orçamento pelo link assinado no e-mail.
2. O sistema verifica se o orçamento está aprovado e se ainda não existe uma
   fatura vinculada.
3. Os dados do cliente, serviço, valor e data de emissão são registrados.
4. O sistema gera um PDF, anexa o arquivo ao e-mail e o envia ao cliente.
5. Após o envio bem-sucedido, `emailed_at` registra a data e hora do envio.

### Dados registrados

A tabela `client_invoices` armazena:

- Número identificador da fatura;
- Identificador do orçamento associado;
- Funcionário responsável pela emissão;
- Nome e e-mail do cliente;
- Descrição do serviço;
- Valor da fatura;
- Data de emissão;
- Data e hora do envio do e-mail, quando concluído;
- Data de criação do registro.

O número da fatura segue o padrão `FAT-AAAAMMDD-NNNNNN`.

### Regras de negócio

- A emissão ocorre automaticamente após a aprovação do cliente. O endpoint
  autenticado permanece disponível para fluxos internos.
- A emissão só é permitida para orçamentos com status `approved`.
- Cada orçamento pode possuir apenas uma fatura de cliente.
- O vínculo com o orçamento é protegido por uma restrição de unicidade no banco de dados.
- Os dados do cliente e do orçamento são registrados na fatura no momento da emissão.
- A emissão da fatura não altera o status do orçamento.
- O envio utiliza as configurações SMTP compartilhadas pelo backend.

**Importante:** se ocorrer uma falha no envio do e-mail, a fatura permanece registrada no banco, mas o campo `emailed_at` continua sem preenchimento. Atualmente, não existe um endpoint específico para reenviar uma fatura já criada.

### Migração do banco de dados

A tabela `client_invoices` é criada pela migração `1a2ad26eb7eb_create_client_invoices.py`.

Para aplicar a migração, execute na pasta `backend`:

```bash
uv run alembic upgrade head
```

## Faturas de pagamento

O backend permite criar e enviar faturas de pagamento destinadas aos freelancers. Esse fluxo é independente das faturas de clientes, que representam a cobrança pelos serviços contratados.

A implementação está localizada em:

A migração `20261116_rejection_comment` adiciona o motivo da recusa às etapas.
Execute `alembic upgrade head` para aplicar as migrações pendentes.

O endpoint `POST /payment-invoices/` cria a fatura, gera o PDF e o envia como anexo ao e-mail do freelancer. O PDF também pode ser baixado por `GET /payment-invoices/{id}/pdf`.

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

As faturas de pagamento, as faturas de clientes e os orçamentos possuem fluxos independentes, embora compartilhem as configurações SMTP do backend.

- `/payment-invoices/`: faturas de pagamento dos freelancers.
- `/client-invoices/`: faturas emitidas para os clientes.
- `/quotes/`: operações relacionadas aos orçamentos.

## Idiomas do freelancer

O freelancer informa os idiomas de **origem** e de **destino** com que
trabalha. Eles ficam nas tabelas `freelancer_source_languages` e
`freelancer_target_languages` (migração `b7d3e5a1c9f2`), ligadas ao perfil do
freelancer e apagadas junto com ele.

### Endpoints

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| PUT | `/employee/me/profile` | `freelancer` | Completa o perfil; aceita `source_language_ids` e `target_language_ids` (opcionais). |
| PATCH | `/employee/me/languages` | `freelancer` | Edita os idiomas depois de o perfil estar completo. |

Regras do `PATCH /employee/me/languages`:

- campo ausente (ou `null`) mantém os idiomas atuais; lista vazia remove todos;
- ids repetidos são ignorados; id de idioma inexistente retorna `422`;
- outros perfis recebem `403`; freelancer com perfil pendente também recebe
  `403` e deve informar os idiomas ao completar o perfil.

O schema público de funcionário (`/auth/me`, `/employee/` e o pré-cadastro)
inclui `source_language_ids` e `target_language_ids`, com listas vazias para
quem não é freelancer.

## Atribuição de tradutores por idioma

`GET /stages/{stage_id}/available-freelancers` (perfil `projetos`) lista os
freelancers ativos, com perfil completo, que não recusaram a etapa. Cada item
traz os campos de funcionário e `language_match`, calculado a partir da
solicitação de origem do projeto (etapa → projeto → orçamento → solicitação):

- `compatible`: o idioma de origem da solicitação está nos idiomas de origem do
  freelancer **e** ao menos um destino da solicitação está nos idiomas de
  destino dele;
- `undeclared`: o freelancer não informou nenhum idioma;
- `incompatible`: informou idiomas, mas não atende à regra acima (inclusive quem
  preencheu só um dos lados).

| Parâmetro | Padrão | Efeito |
|---|---|---|
| `include_all` | `false` | `false`: devolve compatíveis e depois `undeclared`; `true`: devolve todos, na ordem compatível, `undeclared`, incompatível. |

Dentro de cada grupo, a ordem original é mantida. Em projetos sem orçamento não
há filtro nem reordenação e `language_match` é `null`. A exclusão de quem
recusou a etapa continua valendo em qualquer modo e depende do MongoDB: sem
ele, a rota responde `503`.

## Resumo de projetos (dashboard)

O painel do administrador usa um resumo com a quantidade de projetos por
situação. O resumo não lista projetos e não usa o campo `status` do projeto,
que não é alterado pelas telas: a situação é calculada a partir das etapas.

### Endpoint

| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| GET | `/projects/summary` | `admin`, `projetos` | Retorna `total`, `awaiting`, `in_progress` e `completed`. |

Os demais perfis recebem `403 Forbidden`. A listagem `GET /projects/`
continua restrita ao perfil `projetos`.

### Regras de negócio

- **Concluído** (`completed`): o projeto tem ao menos uma etapa e todas estão
  em `done`.
- **Em andamento** (`in_progress`): alguma etapa está em `in_progress` ou
  `testing`, ou o projeto tem ao menos uma etapa em `done` e outra ainda não
  concluída.
- **Aguardando** (`awaiting`): os demais casos, incluindo projetos sem etapas
  e projetos apenas com etapas não iniciadas (`no_freelancer`, `public` ou
  `ready`).

A contagem é feita no banco, agrupando os projetos pelo conjunto de status das
suas etapas; a classificação fica em `ProjectService._classify_progress`.

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
