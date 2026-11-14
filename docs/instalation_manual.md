# Manual de Instalação e Desenvolvimento

Este manual prepara o ambiente local do SoftTranslations no Windows ou Linux.

Ele cobre o backend Python/FastAPI, o banco PostgreSQL e o frontend Expo, incluindo a configuração do Assistente Público integrado ao Google Gemini e do envio de documentos PDF por e-mail.

Para orientações de uso das telas, consulte o [Manual do Usuário](./user_manual.md).

## Sumário

- [Requisitos](#requisitos)
- [Obter o código](#obter-o-código)
- [Preparar o PostgreSQL](#preparar-o-postgresql)
- [Configurar e iniciar o backend](#configurar-e-iniciar-o-backend)
- [Configurar e iniciar o frontend](#configurar-e-iniciar-o-frontend)
- [Assistente Público](#assistente-público)
- [Usar o sistema em sessões futuras](#usar-o-sistema-em-sessões-futuras)
- [Testes e documentação da API](#testes-e-documentação-da-api)
- [Solução de problemas](#solução-de-problemas)

## Requisitos

Instale:

- Git;
- Python 3.13 ou superior;
- `uv` para sincronizar dependências Python;
- PostgreSQL;
- Node.js e npm, em versões compatíveis com a versão do Expo definida em `Front-Geral/package.json`;
- Chave de API do Google Gemini para utilizar o Assistente Público;
- Conta de e-mail com suporte a SMTP para envio de documentos;
- ReportLab, instalado automaticamente como dependência do backend;
- (Opcional) MongoDB, para persistência dos logs e processamento da outbox.

Confira se os comandos estão disponíveis:

```bash
git --version
node --version
npm --version
uv --version
psql --version
```

No Windows, confira o Python com:

```powershell
py -3.13 --version
```

No Linux, confira com:

```bash
python3.13 --version
```

O MongoDB não é necessário para iniciar a API: sem ele, a aplicação continua funcionando, mas os logs não são persistidos e os eventos da outbox permanecem pendentes. Para habilitar esses recursos, inicie um MongoDB local ou configure uma instância acessível.

O ReportLab é instalado automaticamente durante a sincronização das dependências do backend, por meio do comando `uv sync`.

## Obter o código

Em um terminal:

```bash
git clone https://github.com/SoftworksBR/SoftTraslations.git
cd SoftTraslations
```

Os comandos abaixo partem da pasta raiz do repositório, exceto quando o passo indica outra pasta.

## Preparar o PostgreSQL

Inicie o servidor PostgreSQL e crie um banco vazio chamado `soft_translations_db`.

### Windows

No pgAdmin, conecte-se ao servidor local, clique com o botão direito em **Databases**, escolha **Create > Database...**, informe `soft_translations_db` e salve.

Como alternativa, execute no terminal:

```powershell
psql -U postgres -c "CREATE DATABASE soft_translations_db;"
```

Se o servidor estiver parado, abra **Serviços** no Windows, localize o serviço do PostgreSQL e inicie-o.

### Linux (Ubuntu/Debian)

```bash
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE soft_translations_db;"
```

Em outras distribuições, use o gerenciador de serviços e o procedimento de criação de banco equivalentes.

## Configurar e iniciar o backend

### 1. Instalar dependências e criar o arquivo de ambiente

No Windows PowerShell:

```powershell
cd backend
uv sync
Copy-Item .env.example .env
```

No Linux:

```bash
cd backend
uv sync
cp .env.example .env
```

Edite `backend/.env`. Configure, no mínimo:

- `DATABASE_URL`: conexão do PostgreSQL no formato `postgresql+asyncpg://USUARIO:SENHA@localhost:5432/soft_translations_db`. Substitua `USUARIO` e `SENHA` pelos dados válidos do seu PostgreSQL. Se a senha contiver caracteres reservados para URLs, codifique-os.
- `SECRET_KEY`: segredo aleatório e exclusivo do ambiente. Não mantenha o valor de exemplo ao disponibilizar o sistema a outras pessoas.
- `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD`: credenciais para criar a conta administrativa inicial.
- `GOOGLE_API_KEY`: chave de API do Google Gemini utilizada pelo Assistente Público.

Na primeira inicialização, o backend cria o administrador quando ainda não existem funcionários no banco. As credenciais iniciais só são utilizadas nesse caso; elas não alteram contas já existentes. Guarde-as em local seguro.

### 2. Configuração do Google Gemini

Para habilitar o Assistente Público, obtenha uma chave de API pelo [Google AI Studio](https://aistudio.google.com/apikey).

Adicione a chave ao arquivo `backend/.env`:

```env
GOOGLE_API_KEY=sua_chave_api_google
```

A chave é utilizada exclusivamente pelo backend para autenticar as chamadas ao Google Gemini.

**Importante:**

- Não coloque a chave no frontend ou em variáveis `EXPO_PUBLIC_*`.
- Não compartilhe nem versione o arquivo `backend/.env`.
- Não publique sua chave em repositórios ou documentos.
- Após alterar a chave, reinicie o backend.

O Assistente Público utiliza o Google ADK para executar o agente e processar as mensagens dos usuários por meio do Gemini.

### 3. Configuração de e-mail (SMTP)

O SoftTranslations utiliza SMTP para enviar documentos por e-mail, incluindo os orçamentos em PDF gerados pelo backend.

Para utilizar o Gmail como servidor SMTP, configure as seguintes variáveis no arquivo `backend/.env`:

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

Substitua `seuemail@gmail.com` pelo endereço da conta Gmail que será utilizada para enviar as mensagens.

**Como obter uma senha de aplicativo do Gmail:**

1. Acesse sua [Conta Google](https://myaccount.google.com/).
2. Ative a verificação em duas etapas, caso ainda não esteja habilitada.
3. Acesse a página de [Senhas de app](https://myaccount.google.com/apppasswords).
4. Gere uma senha de aplicativo.
5. Utilize a senha gerada na variável `SMTP_PASSWORD`.

A senha de aplicativo é diferente da senha normal da conta Google.

**Importante:**

- Não utilize a senha normal do Gmail na variável `SMTP_PASSWORD`.
- Não compartilhe a senha de aplicativo.
- Não versione o arquivo `backend/.env`.
- Utilize uma conta de e-mail autorizada para realizar os envios.
- Após alterar as configurações SMTP, reinicie o backend.

As variáveis SMTP são utilizadas pelo backend para estabelecer a conexão com o servidor de e-mail, autenticar a conta e enviar mensagens com documentos anexados.

### 4. Configuração do MongoDB (opcional)

MongoDB é opcional para a inicialização. Para habilitar logs e entrega dos eventos de auditoria, configure também `MONGODB_URI` e `MONGODB_DATABASE` e confirme que o serviço pode ser acessado.

As variáveis `MONGODB_TIMEOUT_MS`, `OUTBOX_POLL_INTERVAL_SECONDS` e `OUTBOX_BATCH_SIZE` controlam a conexão e o processamento da outbox. Os valores padrão estão documentados em `backend/.env.example`.

Outras opções do ambiente incluem `ACCESS_TOKEN_COOKIE_NAME`, duração do token, configurações de cookie e `CORS_ORIGINS`.

Em desenvolvimento web, mantenha a origem do Expo (por padrão, `http://localhost:8081` e `http://127.0.0.1:8081`) entre as origens permitidas. Para uma publicação, ajuste as configurações de cookie e CORS para os domínios e HTTPS do ambiente; não reutilize configurações locais sem revisão.

### 5. Ativar o ambiente e aplicar as migrações

No Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
alembic upgrade head
```

Se o PowerShell bloquear a ativação, permita scripts apenas na sessão atual e repita:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

No Linux:

```bash
source .venv/bin/activate
alembic upgrade head
```

Antes de aplicar migrações em um banco que já contém dados, faça um backup e valide o processo em uma cópia isolada.

### 6. Iniciar a API

Ainda dentro de `backend` e com o ambiente virtual ativo:

```bash
task run
```

O servidor de desenvolvimento escuta na porta `8000` e fica disponível na rede local. Mantenha o terminal aberto enquanto usa o sistema.

A rota raiz da API (`http://localhost:8000/`) requer autenticação; a documentação interativa fica em:

- [Swagger UI](http://localhost:8000/docs)
- [ReDoc](http://localhost:8000/redoc)

## Configurar e iniciar o frontend

Abra um segundo terminal na raiz do repositório.

### Navegador no mesmo computador

```bash
cd Front-Geral
npm install
```

Crie o arquivo `Front-Geral/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

Execute o frontend:

```bash
npm run web
```

Quando o Expo iniciar, abra `http://localhost:8081` ou o endereço informado no terminal.

A variável `EXPO_PUBLIC_API_URL` define o endereço do backend utilizado pelo frontend, inclusive pelo Assistente Público.

### Expo Go em um celular

O celular e o computador devem estar na mesma rede local. Na pasta `Front-Geral`, execute:

```bash
npx expo start --lan
```

O celular não consegue usar `localhost` para acessar o servidor que roda no computador.

Se o endereço detectado automaticamente não funcionar:

1. Descubra o IPv4 do computador (`ipconfig` no Windows; `ip addr` no Linux).
2. Crie `Front-Geral/.env` a partir de `.env.example`.
3. Defina `EXPO_PUBLIC_API_URL=http://IP-DO-COMPUTADOR:8000`, substituindo pelo endereço IPv4 da máquina que executa o backend.
4. Reinicie o Expo para carregar a variável e permita conexões de entrada na porta `8000` no firewall, se solicitado.

Use `EXPO_PUBLIC_API_URL` somente com um endereço acessível a partir do dispositivo que executa o frontend. Essa variável não deve armazenar chaves ou credenciais privadas.

## Assistente Público

O SoftTranslations possui um assistente virtual integrado à landing page pública do sistema.

Ele permite que visitantes consultem informações sobre os serviços de tradução, idiomas disponíveis e estimativas de preços.

A funcionalidade utiliza o Google Gemini por meio do Google ADK no backend.

### Funcionamento

O fluxo de comunicação ocorre da seguinte maneira:

1. O visitante acessa a landing page do SoftTranslations.
2. Abre o botão flutuante do Assistente Público, localizado no canto inferior direito.
3. Envia uma mensagem pelo chat.
4. O frontend encaminha a mensagem para a API do backend.
5. O backend executa o agente utilizando o Google Gemini.
6. O agente consulta as ferramentas disponíveis para obter informações sobre serviços, idiomas e estimativas de preços.
7. A resposta é devolvida ao frontend e exibida na conversa.

### Endpoint da API

O assistente disponibiliza o seguinte endpoint:

**POST** `/public/assistant/chat`

Endereço local completo:

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

O campo `session_id` identifica a sessão de conversa. Na primeira mensagem, pode ser enviado como `null`. Nas mensagens seguintes, o frontend utiliza o identificador retornado pelo backend para manter o contexto da conversa.

### Como testar

Com o PostgreSQL, backend e frontend em execução:

1. Acesse a landing page do SoftTranslations.
2. Localize o botão flutuante do assistente no canto inferior direito.
3. Clique para abrir a janela de conversa.
4. Envie uma mensagem perguntando sobre os serviços disponíveis.
5. Teste perguntas sobre idiomas oferecidos.
6. Solicite uma estimativa de preço para um serviço de tradução.
7. Envie mensagens consecutivas para verificar a continuidade da conversa.

### Limitações

- As estimativas apresentadas pelo assistente são informativas e não representam um orçamento formal.
- O assistente não cria automaticamente um orçamento no sistema.
- A disponibilidade das respostas depende da configuração correta da chave do Google Gemini e do funcionamento do backend.
- As sessões de conversa são mantidas em memória durante a execução atual do frontend e não representam um histórico permanente de atendimento.

## Usar o sistema em sessões futuras

Inicie o PostgreSQL (e o MongoDB, se estiver habilitando logs/outbox) e abra dois terminais na raiz do repositório.

No primeiro, inicie o backend:

Windows PowerShell:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
task run
```

Linux:

```bash
cd backend
source .venv/bin/activate
task run
```

No segundo, inicie o frontend:

```bash
cd Front-Geral
npm run web
```

Abra `http://localhost:8081` no navegador. Para usar um celular, inicie o Expo com `npx expo start --lan` e use a configuração de rede indicada acima.

As configurações de SMTP permanecem no arquivo `backend/.env`. Não é necessário refazer a configuração a cada inicialização, desde que os valores estejam corretos.

## Testes e documentação da API

Com o ambiente virtual do backend ativado, na pasta `backend`:

```bash
task test
```

Esse comando executa o lint antes dos testes e gera o relatório de cobertura HTML. Para executar apenas os testes sem essa etapa, use `uv run pytest`. Para verificar o lint separadamente, use `uv run ruff check`.

Com a API em execução, consulte os endpoints e schemas em:

- [Swagger UI](http://localhost:8000/docs)
- [ReDoc](http://localhost:8000/redoc)

O endpoint do Assistente Público também pode ser testado pela interface Swagger, utilizando `POST /public/assistant/chat`.

## Solução de problemas

- **Falha de conexão com o banco:** confira se o PostgreSQL está ativo, se `soft_translations_db` existe e se `DATABASE_URL` contém usuário, senha, host, porta e nome corretos.
- **Migração não encontrada ou falha ao aplicar:** confirme que o ambiente virtual está ativo e que o terminal está em `backend`. Para bancos com dados, verifique o backup antes de tentar novamente.
- **Conta administrativa não funciona:** confira as três variáveis `INITIAL_ADMIN_*`. Elas inicializam uma base sem funcionários e não redefinem senhas de contas existentes.
- **Frontend informa erro de conexão:** mantenha os dois servidores ativos. Confira o endereço da API, CORS e firewall; no celular, use o IPv4 do computador, não `localhost`.
- **Expo Go não encontra o backend:** confirme que computador e celular estão na mesma rede, que o Expo está em modo LAN e que a porta `8000` está liberada.
- **PowerShell bloqueia a ativação:** use `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` na mesma janela e ative novamente.
- **Porta ocupada:** encerre o serviço que está usando a porta ou escolha uma porta diferente conforme as instruções exibidas pelo Expo.
- **Logs não aparecem no MongoDB:** confirme `MONGODB_URI`, `MONGODB_DATABASE` e a conectividade do serviço. A API pode continuar respondendo sem MongoDB, mas os logs não serão persistidos e a outbox não será entregue.
- **Assistente não responde:** verifique se o backend está em execução e se `GOOGLE_API_KEY` está configurada corretamente no `backend/.env`.
- **Erro relacionado ao Google Gemini:** confira a validade da chave de API, a disponibilidade do serviço e os logs do backend.
- **Assistente não consegue conectar à API:** confira `EXPO_PUBLIC_API_URL`, CORS e conectividade entre frontend e backend. No Expo Go, utilize o IPv4 do computador em vez de `localhost`.
- **Erro HTTP 503 no assistente:** verifique a configuração do Google Gemini e os logs do backend para identificar a falha na execução do agente.
- **Falha no envio de e-mail:** confira `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` e `SMTP_FROM_EMAIL`. Para Gmail, confirme se a verificação em duas etapas está ativa e se foi utilizada uma senha de aplicativo.
- **Erro de autenticação SMTP:** não utilize a senha normal do Gmail. Gere uma nova senha de aplicativo e atualize `SMTP_PASSWORD` no arquivo `backend/.env`.
- **Orçamento não chega ao cliente:** confira se o endereço de e-mail cadastrado na solicitação está correto e verifique a caixa de spam do destinatário.
- **PDF do orçamento não abre:** confirme se as dependências foram sincronizadas com `uv sync`, incluindo o ReportLab. Verifique também os logs do backend e se o arquivo PDF foi gerado corretamente antes do envio.
