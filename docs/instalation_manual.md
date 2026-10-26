# Manual de Instalação e Desenvolvimento

Este manual prepara o ambiente local do SoftTranslations no Windows ou Linux.
Ele cobre o backend Python/FastAPI, o banco PostgreSQL e o frontend Expo. Para
orientações de uso das telas, consulte o [Manual do Usuário](./user_manual.md).

## Sumário

- [Requisitos](#requisitos)
- [Obter o código](#obter-o-codigo)
- [Preparar o PostgreSQL](#preparar-o-postgresql)
- [Configurar e iniciar o backend](#configurar-e-iniciar-o-backend)
- [Configurar e iniciar o frontend](#configurar-e-iniciar-o-frontend)
- [Usar o sistema em sessões futuras](#usar-o-sistema-em-sessoes-futuras)
- [Testes e documentação da API](#testes-e-documentacao-da-api)
- [Solução de problemas](#solucao-de-problemas)

## Requisitos

Instale:

- Git;
- Python 3.13 ou superior;
- `uv` para sincronizar dependências Python;
- PostgreSQL;
- Node.js e npm, em versões compatíveis com a versão do Expo definida em
  `Front-Geral/package.json`;
- (Opcional) MongoDB, para persistência dos logs e processamento da outbox.

Confira se os comandos estão disponíveis:

```text
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

O MongoDB não é necessário para iniciar a API: sem ele, a aplicação continua
funcionando, mas os logs não são persistidos e os eventos da outbox permanecem
pendentes. Para habilitar esses recursos, inicie um MongoDB local ou configure
uma instância acessível.

## Obter o código

Em um terminal:

```text
git clone https://github.com/SoftworksBR/SoftTraslations.git
cd SoftTraslations
```

Os comandos abaixo partem da pasta raiz do repositório, exceto quando o passo
indica outra pasta.

## Preparar o PostgreSQL

Inicie o servidor PostgreSQL e crie um banco vazio chamado
`soft_translations_db`.

### Windows

No pgAdmin, conecte-se ao servidor local, clique com o botão direito em
**Databases**, escolha **Create > Database...**, informe `soft_translations_db`
e salve.

Como alternativa, execute no terminal:

```powershell
psql -U postgres -c "CREATE DATABASE soft_translations_db;"
```

Se o servidor estiver parado, abra **Serviços** no Windows, localize o serviço
do PostgreSQL e inicie-o.

### Linux (Ubuntu/Debian)

```bash
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE soft_translations_db;"
```

Em outras distribuições, use o gerenciador de serviços e o procedimento de
criação de banco equivalentes.

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

- `DATABASE_URL`: conexão do PostgreSQL no formato
  `postgresql+asyncpg://USUARIO:SENHA@localhost:5432/soft_translations_db`.
  Substitua `USUARIO` e `SENHA` pelos dados válidos do seu PostgreSQL. Se
  a senha contiver caracteres reservados para URLs, codifique-os.
- `SECRET_KEY`: segredo aleatório e exclusivo do ambiente. Não mantenha o valor
  de exemplo ao disponibilizar o sistema a outras pessoas.
- `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_EMAIL` e
  `INITIAL_ADMIN_PASSWORD`: credenciais para criar a conta administrativa
  inicial.

Na primeira inicialização, o backend cria o administrador quando ainda não
existem funcionários no banco. As credenciais iniciais só são utilizadas nesse
caso; elas não alteram contas já existentes. Guarde-as em local seguro.

MongoDB é opcional para a inicialização. Para habilitar logs e entrega dos
eventos de auditoria, configure também `MONGODB_URI` e `MONGODB_DATABASE` e
confirme que o serviço pode ser acessado. As variáveis `MONGODB_TIMEOUT_MS`,
`OUTBOX_POLL_INTERVAL_SECONDS` e `OUTBOX_BATCH_SIZE` controlam a conexão e o
processamento da outbox. Os valores padrão estão documentados em
`backend/.env.example`.

Outras opções do ambiente incluem `ACCESS_TOKEN_COOKIE_NAME`, duração do token,
configurações de cookie e `CORS_ORIGINS`. Em desenvolvimento web, mantenha a
origem do Expo (por padrão, `http://localhost:8081` e
`http://127.0.0.1:8081`) entre as origens permitidas. Para uma publicação,
ajuste as configurações de cookie e CORS para os domínios e HTTPS do ambiente;
não reutilize configurações locais sem revisão.

### 2. Ativar o ambiente e aplicar as migrações

No Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
alembic upgrade head
```

Se o PowerShell bloquear a ativação, permita scripts apenas na sessão atual e
repita:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

No Linux:

```bash
source .venv/bin/activate
alembic upgrade head
```

Antes de aplicar migrações em um banco que já contém dados, faça um backup e
valide o processo em uma cópia isolada.

### 3. Iniciar a API

Ainda dentro de `backend` e com o ambiente virtual ativo:

```text
task run
```

O servidor de desenvolvimento escuta na porta `8000` e fica disponível na rede
local. Mantenha o terminal aberto enquanto usa o sistema. A rota raiz da API
(`http://localhost:8000/`) requer autenticação; a documentação interativa fica
em `http://localhost:8000/docs` e `http://localhost:8000/redoc`.

## Configurar e iniciar o frontend

Abra um segundo terminal na raiz do repositório.

### Navegador no mesmo computador

```text
cd Front-Geral
npm install
npm run web
```

Quando o Expo iniciar, abra `http://localhost:8081` ou o endereço informado no
terminal. A configuração padrão aponta a API para `localhost:8000`.

### Expo Go em um celular

O celular e o computador devem estar na mesma rede local. Na pasta
`Front-Geral`, execute:

```text
npx expo start --lan
```

O celular não consegue usar `localhost` para acessar o servidor que roda no
computador. Se o endereço detectado automaticamente não funcionar:

1. Descubra o IPv4 do computador (`ipconfig` no Windows; `ip addr` no Linux).
2. Crie `Front-Geral/.env` a partir de `.env.example`.
3. Defina `EXPO_PUBLIC_API_URL=http://IP-DO-COMPUTADOR:8000`, substituindo pelo
   endereço IPv4 da máquina que executa o backend.
4. Reinicie o Expo para carregar a variável e permita conexões de entrada na
   porta `8000` no firewall, se solicitado.

Use `EXPO_PUBLIC_API_URL` somente com um endereço acessível a partir do
dispositivo que executa o frontend.

## Usar o sistema em sessões futuras

Inicie o PostgreSQL (e o MongoDB, se estiver habilitando logs/outbox) e abra
dois terminais na raiz do repositório.

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

```text
cd Front-Geral
npm run web
```

Abra `http://localhost:8081` no navegador. Para usar um celular, inicie o Expo
com `npx expo start --lan` e use a configuração de rede indicada acima.

## Testes e documentação da API

Com o ambiente virtual do backend ativado, na pasta `backend`:

```text
task test
```

Esse comando executa o lint antes dos testes e gera o relatório de cobertura
HTML. Para executar apenas os testes sem essa etapa, use `uv run pytest`.
Para verificar o lint separadamente, use `uv run ruff check`.

Com a API em execução, consulte os endpoints e schemas em
`http://localhost:8000/docs` (Swagger UI) ou `http://localhost:8000/redoc`.

## Solução de problemas

- **Falha de conexão com o banco:** confira se o PostgreSQL está ativo, se
  `soft_translations_db` existe e se `DATABASE_URL` contém usuário, senha,
  host, porta e nome corretos.
- **Migração não encontrada ou falha ao aplicar:** confirme que o ambiente
  virtual está ativo e que o terminal está em `backend`. Para bancos com dados,
  verifique o backup antes de tentar novamente.
- **Conta administrativa não funciona:** confira as três variáveis `INITIAL_ADMIN_*`.
  Elas inicializam uma base sem funcionários e não redefinem senhas de contas
  existentes.
- **Frontend informa erro de conexão:** mantenha os dois servidores ativos.
  Confira o endereço da API, CORS e firewall; no celular, use o IPv4 do
  computador, não `localhost`.
- **Expo Go não encontra o backend:** confirme que computador e celular estão
  na mesma rede, que o Expo está em modo LAN e que a porta `8000` está liberada.
- **PowerShell bloqueia a ativação:** use `Set-ExecutionPolicy -Scope Process
  -ExecutionPolicy Bypass` na mesma janela e ative novamente.
- **Porta ocupada:** encerre o serviço que está usando a porta ou escolha uma
  porta diferente conforme as instruções exibidas pelo Expo.
- **Logs não aparecem no MongoDB:** confirme `MONGODB_URI`, `MONGODB_DATABASE`
  e a conectividade do serviço. A API pode continuar respondendo sem MongoDB,
  mas os logs não serão persistidos e a outbox não será entregue.
