
1. Requisitos

Antes de começar, instale as seguintes ferramentas:

Git
Node.js e npm
Python 3.13
uv
PostgreSQL

No terminal, verifique as instalações:

git --version
node --version
npm --version
python3.13 --version
uv --version
psql --version

2. Clonar o repositório

git clone https://github.com/SoftworksBR/SoftTraslations.git
cd SoftTraslations

3. Configurar o banco de dados

Inicie o PostgreSQL no Linux/Ubuntu:

sudo systemctl start postgresql

Crie o banco de dados da aplicação:

sudo -u postgres psql

No console do PostgreSQL, execute:

CREATE DATABASE soft_translations_db;

Para sair:

\q

4. Instalar e executar o backend

Entre na pasta do backend:

cd backend

Instale as dependências:

uv sync

Configure o arquivo .env a partir do exemplo:

cp .env.example .env

Edite o arquivo .env e informe as credenciais corretas do PostgreSQL, mantendo o nome do banco soft_translations_db e os demais parâmetros exigidos pelo projeto.

Ative o ambiente virtual:

source .venv/bin/activate

Aplique as migrações do banco:

alembic upgrade head

Inicie o backend:

task run

Mantenha esse terminal aberto enquanto utiliza a aplicação.

5. Instalar e executar o frontend

Abra outro terminal e entre na pasta do frontend:

cd SoftTraslations/Front-Geral

Instale as dependências:

npm install

Inicie a aplicação web:

npm run web

Abra no navegador o endereço exibido pelo Expo, normalmente:

http://localhost:8081

6. Execuções futuras

Depois da instalação inicial, não é necessário repetir todos os passos.

Terminal 1 — PostgreSQL

sudo systemctl start postgresql

Terminal 2 — Backend

cd SoftTraslations/backend
source .venv/bin/activate
task run

Terminal 3 — Frontend

cd SoftTraslations/Front-Geral

npm run web

7. Executar os testes do backend

Dentro da pasta backend, com o ambiente virtual ativado:

task test