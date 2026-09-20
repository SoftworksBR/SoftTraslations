# SoftTranslations - Backend Documentation

## Sumário
- [Requisitos](#requisites)
- [Instalar as dependências](#how-to-install)
- [Executar o backend](#how-to-run)
- [Executar testes](#how-to-test)
- [Arquitetura do projeto](#project-architecture)

## <span id='requisites'> Requisitos do sistema </span>
- Python 3.13
- uv
- PostgreSQL

**Instalação dos requisitos**

Verifique se já possui uma versão instalada com:
```
python --version
uv --version
```

Pesquise por **python** no seu navegador ou clique no seguinte link: https://www.python.org/downloads/ para ser redirecionado para a tela de download. Por fim, faça o download da versão 3.13

Com o python instalado, utilize o comando:
```
pip install uv
```
Para instalar o uv.

Por fim, instale o PostgreSQL através desse link: https://www.postgresql.org/download/

## <span id='how-to-install'> Instalando as dependências </span>
Navegue até a pasta backend utilizando o seguinte comando
```
cd backend
```

É possível escrever "cd b" e apertar Tab para autocompletar

Dentro da pasta backend, utilize o seguinte comando para fazer download do restante das dependências necessárias
```
uv sync
```

Antes de prosseguir para a próxima etapa, inicie o ambiente virtual com
```
.venv\Scripts\Activate.ps1
source .venv/bin/activate
```

Sendo o primeiro comando para Powershell e o segundo para Linux. Após executar um desses comandos, deve aparecer algo entre parênteses antes do caminho da pasta atual. Por exemplo:
```
PS C:\Users\...\SoftTraslations\backend> .venv\Scripts\Activate.ps1
(backend) PS C:\Users\...\SoftTraslations\backend>
```

## <span id='how-to-run'> Executando o projeto </span>

Para rodar o projeto, crie um novo arquivo chamado ``.env`` a partir do arquivo ``.env.example`` e, na primeira linha, mude **postgres_username:postgres_password** para o nome do seu usuário e sua senha, por exemplo, **postgres:senha123**.

Na barra de pesquisa do seu navegador, pesquise por **pgadmin** para abrir o PostgreSQL. Lá, você deve criar um banco de dados vazio com o nome **soft_translations_db**. Para isso, basta clicar nas setas ao lado de Services > PostgreSQL x, depois clique com o botão direito em Databases > Create > Database...

Agora no seu terminal é possível popular o seu banco de dados com o comando
```
alembic upgrade head
```

Por fim, utilize o seguinte comando para executar o projeto:
```
task run
```

Não é necessário repetir todos esses comandos toda vez que quiser iniciar a aplicação, basta digitar ``task run`` assim que tudo estiver corretamente configurado.
Certifique-se que está na pasta backend e com o ambiente virtual ativado.

## <span id='how-to-test'> Testando a aplicação </span>
```
task test
```

## <span id='project-architecture'> Arquitetura do Projeto </span>

```text
backend/
├── alembic/
├── tests/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── repositories/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   ├── database.py
│   ├── main.py
│   ├── security.py
│   └── settings.py
└── ...
```

### Camadas da aplicação

**`routes/`**

Responsável pela definição das **rotas HTTP** da aplicação.
É nessa camada que os endpoints são registrados no FastAPI.

**`controllers/`**

Responsável por lidar com o fluxo relacionado à **requisição HTTP**.
Os controllers recebem os dados provenientes das rotas e delegam o processamento para a camada de serviços.

**`services/`**
Responsável pela **regra de negócio da aplicação**.
Essa é uma das principais camadas da arquitetura, pois concentra operações que representam comportamentos e regras do domínio.

**`repositories/`**

Responsável pelo **acesso aos dados**.
Os repositories abstraem operações relacionadas ao banco de dados, evitando que a camada de serviços precise conhecer detalhes de queries e da infraestrutura de persistência.

**`models/`**

Contém os **modelos de persistência** utilizados pelo SQLAlchemy.
Os models representam as entidades armazenadas no banco de dados e normalmente possuem correspondência com tabelas.

**`schemas/`**

Contém os schemas utilizados para **validação e serialização dos dados da API**.
Enquanto o model representa a entidade persistida, o schema define quais dados podem ser recebidos ou retornados pela API.

### Responsabilidade de cada camada

| Camada          | Responsabilidade                            |
| --------------- | ------------------------------------------- |
| `routes/`       | Definição dos endpoints HTTP                |
| `controllers/`  | Controle do fluxo da requisição             |
| `services/`     | Regras de negócio                           |
| `repositories/` | Acesso e persistência dos dados             |
| `models/`       | Representação das entidades no banco        |
| `schemas/`      | Validação e serialização dos dados da API   |
| `database.py`   | Configuração da infraestrutura do banco     |
| `security.py`   | Autenticação e funcionalidades de segurança |
| `settings.py`   | Configurações da aplicação                  |
| `main.py`       | Inicialização e composição da aplicação     |
| `alembic/`      | Migrações do banco de dados                 |
| `tests/`        | Testes automatizados                        |