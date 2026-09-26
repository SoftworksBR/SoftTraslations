import asyncio
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from src.enums.enums import Roles
from src.main import app
from src.schemas.empresa_schema import EmpresaCriacao, FiltroEmpresa
from src.services.empresa_service import EmpresaService

CNPJ_VALIDO = '11.222.333/0001-81'
CNPJ_ALFANUMERICO_VALIDO = '12.ABC.345/01DE-35'


def _empresa(**alteracoes):
    dados = {'razao_social': 'Empresa Exemplo', 'cnpj': CNPJ_VALIDO}

    return {**dados, **alteracoes}


@pytest.mark.parametrize(
    ('metodo', 'url'),
    [
        ('post', '/empresas/'),
        ('get', '/empresas/'),
        ('get', '/empresas/1'),
    ],
)
def test_rotas_de_empresa_exigem_autenticacao(metodo, url):
    client = TestClient(app)

    resposta = getattr(client, metodo)(url)

    assert resposta.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.parametrize(
    'cargo',
    [Roles.ADMIN, Roles.PROJETOS, Roles.FREELANCER],
)
def test_apenas_atendimento_gerencia_empresas(cargo):
    service = EmpresaService(session=None)
    funcionario = SimpleNamespace(role=cargo)

    with pytest.raises(HTTPException) as erro:
        asyncio.run(service.listar(funcionario, FiltroEmpresa()))

    assert erro.value.status_code == HTTPStatus.FORBIDDEN


def test_empresa_aceita_departamentos_e_contatos_aninhados():
    empresa = EmpresaCriacao.model_validate(
        _empresa(
            razao_social=' Empresa Exemplo ',
            departamentos=[
                {
                    'nome': 'Financeiro',
                    'contatos': [
                        {
                            'nome': 'Maria',
                            'email': 'maria@ex.com',
                            'telefone': '11999990000',
                        }
                    ],
                }
            ],
        )
    )

    assert empresa.razao_social == 'Empresa Exemplo'
    assert empresa.departamentos[0].contatos[0].cargo is None


def test_empresa_pode_ser_criada_sem_departamentos():
    empresa = EmpresaCriacao.model_validate(_empresa())

    assert empresa.departamentos == []


@pytest.mark.parametrize(
    'cnpj',
    [CNPJ_VALIDO, '11222333000181', ' 11.222.333/0001-81 '],
)
def test_cnpj_e_normalizado_para_somente_caracteres(cnpj):
    empresa = EmpresaCriacao.model_validate(_empresa(cnpj=cnpj))

    assert empresa.cnpj == '11222333000181'


def test_cnpj_alfanumerico_valido_e_aceito():
    empresa = EmpresaCriacao.model_validate(
        _empresa(cnpj=CNPJ_ALFANUMERICO_VALIDO)
    )

    assert empresa.cnpj == '12ABC34501DE35'


@pytest.mark.parametrize(
    'cnpj',
    ['', '123', '11.222.333/0001-82', '11222333000180', 'ABCDEFGHIJKLMN'],
)
def test_cnpj_invalido_e_rejeitado_com_mensagem_do_dor(cnpj):
    with pytest.raises(ValidationError) as erro:
        EmpresaCriacao.model_validate(_empresa(cnpj=cnpj))

    assert erro.value.errors()[0]['msg'] == 'CNPJ inválido.'


@pytest.mark.parametrize(
    'payload',
    [
        _empresa(razao_social='   '),
        {'cnpj': CNPJ_VALIDO},
        _empresa(departamentos=[{'nome': ''}]),
        _empresa(
            departamentos=[
                {
                    'nome': 'TI',
                    'contatos': [
                        {'nome': 'Ana', 'email': 'x', 'telefone': '1'}
                    ],
                }
            ]
        ),
        _empresa(
            departamentos=[
                {
                    'nome': 'TI',
                    'contatos': [{'nome': 'Ana', 'email': 'ana@ex.com'}],
                }
            ]
        ),
    ],
)
def test_empresa_rejeita_payload_invalido(payload):
    with pytest.raises(ValidationError):
        EmpresaCriacao.model_validate(payload)
