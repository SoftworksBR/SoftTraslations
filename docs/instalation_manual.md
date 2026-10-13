# Manual de Instalação

## 📖 Sumário

- [Requisitos](#requirements)
- [Clone o repositório](#clone)
- [Configure o banco de dados](#database)
- [Instale e execute o backend](#backend)
- [Instale e execute o frontend](#frontend)
- [Execuções futuras](#post-config)

## <span id="requirements">Requisitos</span>

Antes de começar, instale as seguintes ferramentas:

- Git
- Node.js e npm
- Python 3.13
- uv
- PostgreSQL

No terminal, verifique as instalações:

```
git --version

node --version

npm --version

python3.13 --version

uv --version

psql --version
```

## <span id="clone">Clone o repositório</span>


```
git clone https://github.com/SoftworksBR/SoftTraslations.git

cd SoftTraslations
```

## <span id="database">Configure o banco de dados</span>

- Inicie o PostgreSQL no Linux/Ubuntu:
```
sudo systemctl start postgresql
```

- Crie o banco de dados da aplicação:
```
sudo -u postgres psql
```

- No console do PostgreSQL, execute:
```
CREATE DATABASE soft_translations_db;
```

- Para sair:
```
\q
```

## <span id="backend">Instale e execute o backend</span>

- Entre na pasta do backend:
```
cd backend
```

- Instale as dependências:
```
uv sync
```

- Configure o arquivo .env a partir do exemplo:
```
cp .env.example .env
```

Você deve fazer as seguintes alterações no seu .env:
- Na linha 1, troque **postgres_username** pelo nome de usuário que você utilizou
- Na linha 1, troque **postgres_password** pela senha que você colocou
- Na linha 2, troque **soft_translations_ultra_secret_key** por uma chave secreta da sua preferência
- Na linha 4, troque **60** pela quantidade (em minutos) que você deseja que o usuário permaneça logado no site  

Vale lembrar que apenas os dois primeiros itens irão impactar a funcionalidade do sistema, caso decida não alterar os outros tópicos vai continuar funcionando normalmente.

- Ative o ambiente virtual:
```
source .venv/bin/activate
```

- Aplique as migrações do banco:
```
alembic upgrade head
```

- Inicie o backend:
```
task run
```

Mantenha esse terminal aberto enquanto utiliza a aplicação.

## <span id="frontend">Instale e executar o frontend</span>

- Abra outro terminal e entre na pasta do frontend:
```
cd SoftTraslations/Front-Geral
```

- Instale as dependências:
```
npm install
```

- Inicie a aplicação web:
```
npm run web
```

- Abra no navegador o endereço exibido pelo Expo, normalmente:

http://localhost:8081

## <span id="post-config">Execuções futuras</span>

Depois da instalação inicial, não é necessário repetir todos os passos. Basta executar os seguintes comandos que são utilizados para iniciar a aplicação:

- Terminal 1 — PostgreSQL
```
# Inicia o banco de dados
sudo systemctl start postgresql
```

- Terminal 2 — Backend
```
# Entra na pasta do backend
cd SoftTraslations/backend

# Ativa o ambiente virtual
source .venv/bin/activate

# Executa o backend
task run
```

- Terminal 3 — Frontend
```
# Entra na pasta do frontend
cd SoftTraslations/Front-Geral

# Executa o frontend
npm run web
```