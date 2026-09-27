import asyncio
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from src.enums.enums import Roles
from src.main import app
from src.schemas.company_schema import CompanyCreate, CompanyFilter
from src.services.company_service import CompanyService

VALID_CNPJ = '11.222.333/0001-81'
VALID_ALPHANUMERIC_CNPJ = '12.ABC.345/01DE-35'


def _company(**overrides):
    data = {'name': 'Empresa Exemplo', 'cnpj': VALID_CNPJ}

    return {**data, **overrides}


@pytest.mark.parametrize(
    ('method', 'url'),
    [
        ('post', '/companies/'),
        ('get', '/companies/'),
        ('get', '/companies/1'),
    ],
)
def test_company_routes_require_authentication(method, url):
    client = TestClient(app)

    response = getattr(client, method)(url)

    assert response.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.parametrize(
    'role',
    [Roles.ADMIN, Roles.PROJETOS, Roles.FREELANCER],
)
def test_only_atendimento_can_manage_companies(role):
    service = CompanyService(session=None)
    employee = SimpleNamespace(role=role)

    with pytest.raises(HTTPException) as error:
        asyncio.run(service.get_all(employee, CompanyFilter()))

    assert error.value.status_code == HTTPStatus.FORBIDDEN


def test_company_accepts_nested_departments_and_contacts():
    company = CompanyCreate.model_validate(
        _company(
            name=' Empresa Exemplo ',
            departments=[
                {
                    'name': 'Financeiro',
                    'contacts': [
                        {
                            'name': 'Maria',
                            'email': 'maria@ex.com',
                            'phone': '11999990000',
                        }
                    ],
                }
            ],
        )
    )

    assert company.name == 'Empresa Exemplo'
    assert company.departments[0].contacts[0].job_title is None


def test_company_can_be_created_without_departments():
    company = CompanyCreate.model_validate(_company())

    assert company.departments == []


@pytest.mark.parametrize(
    'cnpj',
    [VALID_CNPJ, '11222333000181', ' 11.222.333/0001-81 '],
)
def test_cnpj_is_normalized_to_digits_only(cnpj):
    company = CompanyCreate.model_validate(_company(cnpj=cnpj))

    assert company.cnpj == '11222333000181'


def test_valid_alphanumeric_cnpj_is_accepted():
    company = CompanyCreate.model_validate(
        _company(cnpj=VALID_ALPHANUMERIC_CNPJ)
    )

    assert company.cnpj == '12ABC34501DE35'


@pytest.mark.parametrize(
    'cnpj',
    ['', '123', '11.222.333/0001-82', '11222333000180', 'ABCDEFGHIJKLMN'],
)
def test_invalid_cnpj_is_rejected_with_dor_message(cnpj):
    with pytest.raises(ValidationError) as error:
        CompanyCreate.model_validate(_company(cnpj=cnpj))

    assert error.value.errors()[0]['msg'] == 'CNPJ inválido.'


@pytest.mark.parametrize(
    'payload',
    [
        _company(name='   '),
        {'cnpj': VALID_CNPJ},
        _company(departments=[{'name': ''}]),
        _company(
            departments=[
                {
                    'name': 'TI',
                    'contacts': [{'name': 'Ana', 'email': 'x', 'phone': '1'}],
                }
            ]
        ),
        _company(
            departments=[
                {
                    'name': 'TI',
                    'contacts': [{'name': 'Ana', 'email': 'ana@ex.com'}],
                }
            ]
        ),
    ],
)
def test_company_rejects_invalid_payload(payload):
    with pytest.raises(ValidationError):
        CompanyCreate.model_validate(payload)
