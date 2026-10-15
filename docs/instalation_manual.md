# Manual de Instalação

Este manual explica como preparar o ambiente de desenvolvimento e executar o SoftTranslations localmente no **Windows** ou no **Linux**. Os comandos são diferentes em cada sistema; siga somente a seção correspondente ao seu computador.

## Sumário

- [Requisitos](#requisitos)
- [Clonar o repositório](#clonar-o-repositorio)
- [Configurar o PostgreSQL](#configurar-o-postgresql)
- [Preparar e executar o backend](#preparar-e-executar-o-backend)
- [Preparar e executar o frontend](#preparar-e-executar-o-frontend)
- [Executar o sistema em outros dias](#executar-o-sistema-em-outros-dias)
- [Solução de problemas](#solucao-de-problemas)

## Requisitos

Instale as seguintes ferramentas:

- Git
- Node.js e npm
- Python 3.13
- uv
- PostgreSQL

Verifique as instalações em um terminal:

```text
git --version
node --version
npm --version
uv --version
psql --version
```

No Windows, verifique também o Python pelo inicializador `py`:

```powershell
py -3.13 --version
```

No Linux, o comando pode ser `python3.13 --version`:

```bash
python3.13 --version
```

Instale o Python 3.13 e o PostgreSQL pelos instaladores ou pacotes oficiais para seu sistema. Instale o `uv` seguindo as instruções da documentação oficial do projeto `uv`.

## Clonar o repositório

Os comandos abaixo são iguais nos dois sistemas:

```text
git clone https://github.com/SoftworksBR/SoftTraslations.git
cd SoftTraslations
```

Execute os comandos seguintes a partir da pasta do repositório, salvo indicação contrária.

## Configurar o PostgreSQL

Crie um banco vazio chamado `soft_translations_db`. Escolha a instrução correspondente ao seu sistema.

### Windows

1. Abra o **pgAdmin** instalado com o PostgreSQL e conecte-se ao servidor local.
2. Clique com o botão direito em **Databases** e selecione **Create > Database...**.
3. Informe `soft_translations_db` como nome e salve.

Como alternativa, em um terminal com `psql` disponível, execute:

```powershell
psql -U postgres -c "CREATE DATABASE soft_translations_db;"
```

O PostgreSQL normalmente é iniciado como serviço do Windows. Se o serviço não estiver ativo, abra **Serviços**, localize o serviço PostgreSQL instalado e selecione **Iniciar**.

### Linux (Ubuntu/Debian)

Inicie o serviço e crie o banco:

```bash
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE soft_translations_db;"
```

Se `systemctl` não estiver disponível em sua distribuição, inicie o PostgreSQL pelo gerenciador de serviços correspondente.

## Preparar e executar o backend

### Windows (PowerShell)

```powershell
cd backend
uv sync
Copy-Item .env.example .env
```

Abra `backend/.env` e ajuste a variável `DATABASE_URL` com o usuário, a senha e o nome do banco criados para o PostgreSQL. O banco deve ser `soft_translations_db`. Defina também uma `SECRET_KEY` própria para o ambiente.

Ative o ambiente virtual e aplique as migrações:

```powershell
.\.venv\Scripts\Activate.ps1
alembic upgrade head
```

Se o PowerShell bloquear a ativação do ambiente virtual, permita scripts somente na sessão atual e tente novamente:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Inicie o servidor:

```powershell
task run
```

Mantenha este terminal aberto enquanto usa a aplicação.

### Linux

```bash
cd backend
uv sync
cp .env.example .env
```

Abra `backend/.env` e ajuste `DATABASE_URL` com o usuário, a senha e o nome do banco criados para o PostgreSQL. O banco deve ser `soft_translations_db`. Defina também uma `SECRET_KEY` própria para o ambiente.

Ative o ambiente virtual e aplique as migrações:

```bash
source .venv/bin/activate
alembic upgrade head
```

Inicie o servidor:

```bash
task run
```

Mantenha este terminal aberto enquanto usa a aplicação.

## Preparar e executar o frontend

Abra **outro terminal** na pasta raiz do repositório.

### Windows (PowerShell)

```powershell
cd Front-Geral
npm install
npm run web
```

### Linux

```bash
cd Front-Geral
npm install
npm run web
```

Quando o Expo iniciar, acesse no navegador o endereço informado no terminal; normalmente é `http://localhost:8081`.

O frontend usa `http://127.0.0.1:8000` como endereço padrão do backend. Para apontá-lo a outro endereço, crie `Front-Geral/.env` com `EXPO_PUBLIC_API_URL=http://<endereco-do-backend>:8000` e reinicie o Expo.

## Executar o sistema em outros dias

Inicie o PostgreSQL (no Linux, use `sudo systemctl start postgresql`; no Windows, inicie o serviço PostgreSQL pelo aplicativo **Serviços**). Depois, abra dois terminais na raiz do repositório.

No primeiro terminal, inicie o backend:

### Windows (PowerShell)

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
task run
```

### Linux

```bash
cd backend
source .venv/bin/activate
task run
```

No segundo terminal, inicie o frontend:

```text
cd Front-Geral
npm run web
```

Abra `http://localhost:8081` no navegador.

## Solução de problemas

- **Falha de conexão com o banco:** confirme que o serviço PostgreSQL está ativo, que o banco `soft_translations_db` existe e que os dados em `backend/.env` estão corretos.
- **Erro ao aplicar migrações:** verifique se o ambiente virtual está ativado e se você está dentro da pasta `backend`.
- **O PowerShell não permite ativar o ambiente virtual:** execute a instrução `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` indicada acima na mesma janela.
- **A tela não consegue acessar a API:** mantenha o backend em execução e confirme se o frontend está apontando para o endereço correto do backend.
- **A porta já está em uso:** encerre a aplicação que está usando a porta ou siga as instruções exibidas pelo Expo para selecionar outra porta.