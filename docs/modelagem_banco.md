# Modelagem do Banco de Dados

Este documento descreve os dados do SoftTranslations: o banco relacional
(PostgreSQL), que guarda o negócio, e o banco de documentos (MongoDB), que
guarda a trilha de auditoria e os logs técnicos.

Os diagramas e os campos abaixo foram gerados a partir dos modelos do backend
(`backend/src/models`) e das migrations (`backend/alembic/versions`), e
conferidos com um banco criado do zero por `alembic upgrade head`.

## Sumário

- [Visão geral](#visão-geral)
- [Banco relacional (PostgreSQL)](#banco-relacional-postgresql)
  - [Pessoas, perfis e cadastros](#1-pessoas-perfis-e-cadastros)
  - [Solicitação, orçamento e fatura de venda](#2-solicitação-orçamento-e-fatura-de-venda)
  - [Projetos, etapas e fatura de pagamento](#3-projetos-etapas-e-fatura-de-pagamento)
  - [Fila de eventos (outbox)](#4-fila-de-eventos-outbox)
- [Valores dos campos de situação](#valores-dos-campos-de-situação)
- [Regras de integridade](#regras-de-integridade)
- [Banco de documentos (MongoDB)](#banco-de-documentos-mongodb)
- [Migrations](#migrations)

## Visão geral

| Banco | Tecnologia | Uso |
| --- | --- | --- |
| Relacional | PostgreSQL, acessado por SQLAlchemy 2 (assíncrono) e versionado por Alembic | Contas, solicitações, orçamentos, projetos, etapas, arquivos e faturas. |
| Documentos | MongoDB | Auditoria das ações (`audit_logs`) e logs técnicos da aplicação (`application_logs`). |

O fluxo de negócio segue esta ordem:

```text
Solicitação (requests) -> Orçamento (quotes) -> Projeto (projects)
   -> Trilhas (project_paths) -> Etapas (project_stages) -> Arquivos (files)
Orçamento aprovado -> Fatura de venda (client_invoices)
Etapa de um tradutor -> Fatura de pagamento (payment_invoices)
```

São 23 tabelas de negócio, mais a tabela `alembic_version`, que o Alembic usa
para registrar a versão do esquema.

## Banco relacional (PostgreSQL)

Legenda dos diagramas: `PK` chave primária, `FK` chave estrangeira, `UK`
valor único. Os tipos `string_N` indicam texto com limite de N caracteres.
Nas ligações, `|o--o{` indica uma relação opcional (a coluna aceita nulo).

### 1. Pessoas, perfis e cadastros

```mermaid
erDiagram
    companies {
        int id PK
        string name
        string primary_email
        string website
        string primary_phone
        string general_info
        bool is_legal_entity
        string tax_id UK
        datetime created_at
    }
    company_employees {
        int id PK
        int company_id FK
        string first_name
        string last_name
        string email
        string phone
        string general_info
    }
    employees {
        int id PK
        string username
        string email UK
        string password_hash
        enum role
        string first_name
        string last_name
        date birth_date
        string phone
        enum account_status
        enum status
        datetime created_at
        datetime updated_at
    }
    freelancer_profiles {
        int employee_id PK,FK
        string specialization
        decimal hourly_rate
        string bio
        bool is_available
        bool profile_completed
    }
    freelancer_source_languages {
        int employee_id PK,FK
        int language_id PK,FK
    }
    freelancer_target_languages {
        int employee_id PK,FK
        int language_id PK,FK
    }
    languages {
        int id PK
        string name
        string code UK
        bool is_active
    }
    people {
        int id PK
        string first_name
        string last_name
        string email
        string phone
        string general_info
        bool is_natural_person
        datetime created_at
    }
    companies ||--o{ company_employees : "company_id"
    employees ||--o| freelancer_profiles : "employee_id"
    freelancer_profiles ||--o{ freelancer_source_languages : "employee_id"
    languages ||--o{ freelancer_source_languages : "language_id"
    freelancer_profiles ||--o{ freelancer_target_languages : "employee_id"
    languages ||--o{ freelancer_target_languages : "language_id"
```

| Tabela | Finalidade |
| --- | --- |
| `employees` | Contas que entram no sistema: administrador, atendimento, gestor de projetos (`projetos`) e tradutor freelancer. O perfil vem de `role`. `account_status` indica conta ativa ou desativada e `status` indica a disponibilidade. O e-mail é único. Só o hash da senha é guardado. |
| `freelancer_profiles` | Dados extras do tradutor (especialização, valor por hora, biografia, disponibilidade e se o cadastro foi concluído). A chave é o próprio `employee_id`: cada tradutor tem no máximo um perfil. |
| `freelancer_source_languages` e `freelancer_target_languages` | Idiomas de origem e de destino em que o tradutor trabalha (relação muitos para muitos entre perfil e `languages`). São usados para filtrar candidatos na designação de etapas. |
| `languages` | Catálogo de idiomas, com código único e indicador de ativo. |
| `companies` e `company_employees` | Empresas clientes (pessoa jurídica ou não, com CNPJ/CPF único) e os contatos de cada empresa. Ao apagar a empresa, os contatos são apagados. |
| `people` | Cadastro avulso de pessoas de contato (nome, e-mail, telefone), sem vínculo direto com outras tabelas. |

### 2. Solicitação, orçamento e fatura de venda

```mermaid
erDiagram
    client_invoices {
        int id PK
        string_30 invoice_number UK
        int quote_id FK
        int created_by_id FK
        string_255 client_name
        string_255 client_email
        string_500 description
        decimal amount
        date issued_on
        datetime emailed_at
        datetime created_at
    }
    employees {
        int id PK
        string username
        string email UK
        string password_hash
        enum role
        string first_name
        string last_name
        date birth_date
        string phone
        enum account_status
        enum status
        datetime created_at
        datetime updated_at
    }
    files {
        int id PK
        string file_path
        string original_name
        int request_id FK
        int project_stage_id FK
        string mime_type
        int size_bytes
        int uploaded_by_id FK
        datetime created_at
    }
    languages {
        int id PK
        string name
        string code UK
        bool is_active
    }
    quotes {
        int id PK
        int request_id FK
        decimal value
        date deadline
        int created_by_id FK
        string observations
        enum status
        int approved_by_id FK
        datetime approved_at
        datetime created_at
        datetime updated_at
    }
    request_target_languages {
        int request_id PK,FK
        int language_id PK,FK
    }
    requests {
        int id PK
        string username
        string email
        string phone
        int source_language_id FK
        string public_token UK
        string company_name
        int service_id FK
        string observations
        int word_count
        int employee_id FK
        enum status
        datetime created_at
    }
    services {
        int id PK
        string name UK
        string description
        bool is_active
        datetime created_at
    }
    translation_prices {
        int id PK
        int service_id FK
        int source_language_id FK
        int target_language_id FK
        decimal price_per_word
        bool is_active
    }
    quotes ||--o| client_invoices : "quote_id"
    employees ||--o{ client_invoices : "created_by_id"
    requests |o--o{ files : "request_id"
    employees |o--o{ files : "uploaded_by_id"
    requests ||--o| quotes : "request_id"
    employees ||--o{ quotes : "created_by_id"
    employees |o--o{ quotes : "approved_by_id"
    requests ||--o{ request_target_languages : "request_id"
    languages ||--o{ request_target_languages : "language_id"
    languages ||--o{ requests : "source_language_id"
    services |o--o{ requests : "service_id"
    employees |o--o{ requests : "employee_id"
    services ||--o{ translation_prices : "service_id"
    languages ||--o{ translation_prices : "source_language_id"
    languages ||--o{ translation_prices : "target_language_id"
```

| Tabela | Finalidade |
| --- | --- |
| `requests` | Solicitação enviada pelo formulário público: dados do cliente, idioma de origem, serviço, observações e quantidade de palavras. O `public_token` é único e dá ao cliente acesso à própria solicitação. `employee_id` é o funcionário vinculado à solicitação, quando informado. |
| `request_target_languages` | Idiomas de destino da solicitação (uma solicitação pode ter vários). |
| `services` | Catálogo de serviços (nome único, ativo ou inativo). |
| `translation_prices` | Preço por palavra para cada combinação de serviço, idioma de origem e idioma de destino. A combinação é única. |
| `quotes` | Orçamento de uma solicitação (no máximo um por solicitação): valor, prazo, observações, situação e quem o criou e o aprovou. |
| `files` | Arquivos anexados. Pertencem a uma solicitação (`request_id`) ou a uma etapa de projeto (`project_stage_id`), com nome original, tipo, tamanho e quem enviou. |
| `client_invoices` | Fatura de venda emitida ao cliente a partir do orçamento aprovado (uma por orçamento), com número único, valor, data e registro do envio por e-mail. |

### 3. Projetos, etapas e fatura de pagamento

```mermaid
erDiagram
    employees {
        int id PK
        string username
        string email UK
        string password_hash
        enum role
        string first_name
        string last_name
        date birth_date
        string phone
        enum account_status
        enum status
        datetime created_at
        datetime updated_at
    }
    files {
        int id PK
        string file_path
        string original_name
        int request_id FK
        int project_stage_id FK
        string mime_type
        int size_bytes
        int uploaded_by_id FK
        datetime created_at
    }
    path_stages {
        int id PK
        int path_id FK
        int stage_template_id FK
        int sequence
    }
    paths {
        int id PK
        string name
    }
    payment_invoices {
        int id PK
        string_30 invoice_number UK
        int freelancer_id FK
        int created_by_id FK
        string_500 description
        decimal amount
        date issued_on
        int project_id FK
        int stage_id FK
        datetime emailed_at
        datetime created_at
    }
    project_paths {
        int id PK
        int project_id FK
        int path_id FK
        int sequence
    }
    project_stages {
        int id PK
        int project_path_id FK
        int path_stage_id FK
        int path_id FK
        int freelancer_id FK
        enum status
        datetime created_at
        datetime started_at
        datetime completed_at
        string_1000 rejection_comment
        int second_freelancer_id FK
        enum second_status
    }
    projects {
        int id PK
        string name
        enum status
        int creator_id FK
        int quote_id FK
    }
    quotes {
        int id PK
        int request_id FK
        decimal value
        date deadline
        int created_by_id FK
        string observations
        enum status
        int approved_by_id FK
        datetime approved_at
        datetime created_at
        datetime updated_at
    }
    stage_templates {
        int id PK
        string name
        string description
    }
    project_stages |o--o{ files : "project_stage_id"
    employees |o--o{ files : "uploaded_by_id"
    paths ||--o{ path_stages : "path_id"
    stage_templates ||--o{ path_stages : "stage_template_id"
    employees ||--o{ payment_invoices : "freelancer_id"
    employees ||--o{ payment_invoices : "created_by_id"
    projects |o--o{ payment_invoices : "project_id"
    project_stages |o--o{ payment_invoices : "stage_id"
    projects ||--o{ project_paths : "project_id"
    paths ||--o{ project_paths : "path_id"
    project_paths ||--o{ project_stages : "project_path_id"
    path_stages ||--o{ project_stages : "path_stage_id"
    path_stages ||--o{ project_stages : "path_id"
    project_paths ||--o{ project_stages : "path_id"
    employees |o--o{ project_stages : "freelancer_id"
    employees |o--o{ project_stages : "second_freelancer_id"
    employees ||--o{ projects : "creator_id"
    quotes ||--o| projects : "quote_id"
    employees ||--o{ quotes : "created_by_id"
    employees |o--o{ quotes : "approved_by_id"
```

| Tabela | Finalidade |
| --- | --- |
| `stage_templates` | Modelos reutilizáveis de etapa (por exemplo, tradução ou revisão). |
| `paths` e `path_stages` | Trilhas de workflow: uma trilha é uma sequência ordenada de modelos de etapa. `sequence` define a ordem dentro da trilha. |
| `projects` | Projeto criado a partir de um orçamento aprovado (um projeto por orçamento), com nome, situação e criador. |
| `project_paths` | Trilhas aplicadas a um projeto, com a ordem em que são executadas. |
| `project_stages` | Etapas reais do projeto. `freelancer_id` é o tradutor principal; `second_freelancer_id` e `second_status` guardam o tradutor adicional (no máximo um) e se ele apenas foi convidado ou já aceitou. `rejection_comment` guarda o motivo quando o gestor reprova a entrega. |
| `payment_invoices` | Fatura de pagamento a um tradutor, com número único, valor, data, envio por e-mail e, opcionalmente, o projeto e a etapa relacionados. |

### 4. Fila de eventos (outbox)

```mermaid
erDiagram
    outbox_events {
        int id PK
        string_120 event_type
        string_80 aggregate_type
        int aggregate_id
        jsonb payload
        uuid event_id UK
        datetime created_at
        datetime processed_at
        int attempts
        datetime next_attempt_at
        datetime locked_until
        string_80 locked_by
        string_500 last_error
    }
```

`outbox_events` implementa o padrão *transactional outbox*: cada ação
importante grava um evento na mesma transação que altera os dados. Um processo
em segundo plano lê os eventos pendentes e os copia para a coleção
`audit_logs` do MongoDB, com novas tentativas em caso de falha
(`attempts`, `next_attempt_at`, `locked_until`, `last_error`). Assim, uma
indisponibilidade do MongoDB não perde eventos nem impede a operação.

## Valores dos campos de situação

| Campo | Valores |
| --- | --- |
| `employees.role` | `admin`, `projetos`, `atendimento`, `freelancer` |
| `employees.account_status` | `active`, `disabled` |
| `employees.status` | `available`, `busy`, `pending` |
| `requests.status` | `pending`, `quoted`, `rejected` |
| `quotes.status` | `in_review`, `approved`, `rejected` |
| `projects.status` | `ready`, `in_progress`, `testing`, `done` |
| `project_stages.status` | `no_freelancer`, `public`, `ready`, `in_progress`, `testing`, `done` |
| `project_stages.second_status` | `invited`, `accepted` (vazio quando não há tradutor adicional) |

## Regras de integridade

- **Um para um:** uma solicitação tem no máximo um orçamento; um orçamento gera
  no máximo um projeto e uma fatura de venda.
- **Unicidade:** e-mail de funcionário, número de fatura (venda e pagamento),
  token público da solicitação, nome de serviço, código de idioma e CNPJ/CPF.
- **Ordem sem repetição:** dentro de uma trilha ou projeto, `sequence` e a
  combinação de trilha e etapa não se repetem. Cada etapa do projeto
  corresponde a uma única etapa da trilha.
- **Preços:** só existe um preço por combinação de serviço, idioma de origem e
  idioma de destino.
- **Exclusão em cascata:** ao apagar uma solicitação, seus arquivos e idiomas
  de destino são apagados; ao apagar uma empresa, seus contatos; ao apagar um
  projeto, suas trilhas e etapas; ao apagar um funcionário freelancer, seu
  perfil e idiomas.
- **Exclusão protegida (`RESTRICT`):** não é possível apagar o orçamento ou o
  funcionário que consta em uma fatura, nem o modelo de etapa ou a trilha em
  uso por um projeto.
- **Exclusão com perda de vínculo (`SET NULL`):** se o tradutor principal ou o
  adicional for apagado, a etapa permanece e o campo fica vazio; se quem enviou
  um arquivo for apagado, o arquivo permanece sem autor.
- **Tradutor adicional:** a etapa aceita no máximo um tradutor adicional,
  distinto do principal. Só o gestor convida e remove (regras aplicadas pela API, não pelo banco).

## Banco de documentos (MongoDB)

O MongoDB é opcional para iniciar o sistema: sem ele, a API funciona, os eventos
da outbox ficam pendentes e os logs técnicos não são gravados. O banco usado é
definido por `MONGODB_DATABASE` (padrão `softtranslations`).

### Coleção `audit_logs` (trilha de auditoria)

Uma linha por ação relevante, gravada pelo processo da outbox. A gravação usa
`event_id` como chave de substituição, então reprocessar um evento não o
duplica.

| Campo | Conteúdo |
| --- | --- |
| `event_id` | Identificador único do evento (o mesmo de `outbox_events.event_id`). |
| `timestamp` | Momento da ação. |
| `actor` | Quem executou (`employee_id` do funcionário) ou nulo em ações públicas. |
| `action` | Tipo da ação, no formato `entidade.acao`. |
| `entity` | `type` e `id` do registro afetado. |
| `details` | Dados específicos da ação (por exemplo, `freelancer_id`). |
| `request_id`, `correlation_id`, `source` | Rastreamento da requisição e origem (`api`). |

Ações registradas hoje: `request.created`, `request.updated`, `request.deleted`,
`request.quoted`, `request.rejected`, `request.reopened`, `request.file_added`,
`quote.created`, `quote.updated`, `quote.deleted`, `quote.approved`,
`quote.rejected`, `project.created`, `project.updated`, `project.deleted`,
`project.path_assigned`, `project_stage.created`, `project_stage.updated`,
`project_stage.completed`, `project_stage.deleted`,
`project_stage.file_added`, `project_stage.file_removed`,
`project_stage.declined`, `project_stage.collaborator_invited`,
`project_stage.collaborator_removed`, `stage_template.created`,
`path.created`, `company.created` e `person.created`.

Índices: `event_id` (único); (`entity.type`, `entity.id`, `timestamp`);
(`actor.employee_id`, `timestamp`); (`action`, `timestamp`); `timestamp`.

Além de auditoria, o evento `project_stage.declined` também é consultado pela
designação de etapas para não oferecer de novo a etapa a quem já a recusou.

### Coleção `application_logs` (logs técnicos)

| Campo | Conteúdo |
| --- | --- |
| `timestamp` | Momento do registro. |
| `level` | Nível (`INFO`, `WARNING`, `ERROR`...). |
| `logger` | Origem do log. |
| `message` | Mensagem, com valores sensíveis (senha, token, segredo, autorização) substituídos por `[REDACTED]`. |
| `request_id`, `correlation_id` | Rastreamento da requisição. |
| `exception_type` | Tipo da exceção, quando há. |
| `context` | Dados extras (objeto). |

## Migrations

O esquema é versionado com Alembic em `backend/alembic/versions`, com uma única
cabeça de migração. Para criar ou atualizar o banco:

```bash
cd backend
uv run alembic upgrade head
```

Para ver a versão atual e o histórico, use `uv run alembic current` e
`uv run alembic history`. O passo a passo de instalação está no
[Manual de Instalação](./instalation_manual.md).
