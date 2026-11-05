import asyncio
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from src.enums.enums import Roles
from src.main import app
from src.schemas.company_schema import CompanyCreate, PersonCreate
from src.services.company_service import CompanyService


def test_customer_routes_require_authentication():
    client = TestClient(app)
    for path in ('/companies/', '/people/'):
        response = client.get(path)
        assert response.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.parametrize(
    'role',
    [Roles.ADMIN, Roles.PROJETOS, Roles.FREELANCER],
)
def test_only_atendimento_manages_customer_records(role):
    service = CompanyService(session=None)
    current_employee = SimpleNamespace(role=role)

    with pytest.raises(HTTPException) as error:
        asyncio.run(service.list_companies(current_employee))

    assert error.value.status_code == HTTPStatus.FORBIDDEN


def test_company_registration_accepts_employees():
    company = CompanyCreate.model_validate({
        'name': 'Acme Ltda',
        'primary_email': 'contact@acme.example',
        'primary_phone': '+5511999999999',
        'website': 'https://acme.example',
        'general_info': 'Technical translation customer',
        'is_legal_entity': True,
        'employees': [
            {
                'first_name': 'Ana',
                'last_name': 'Silva',
                'email': 'ana@acme.example',
                'phone': '+5511888888888',
                'general_info': 'Prefers email contact',
            }
        ],
    })

    assert company.name == 'Acme Ltda'
    assert company.is_legal_entity is True
    assert company.employees[0].first_name == 'Ana'


def test_company_employee_list_is_optional():
    company = CompanyCreate.model_validate({
        'name': 'Acme Ltda',
        'primary_email': 'contact@acme.example',
        'primary_phone': '+5511999999999',
    })
    assert company.employees == []


def test_person_registration_marks_natural_person():
    person = PersonCreate.model_validate({
        'first_name': 'Ana',
        'last_name': 'Silva',
        'email': 'ana@example.com',
        'phone': '+5511999999999',
        'general_info': 'Prefers email contact',
    })
    assert person.is_natural_person is True


@pytest.mark.parametrize(
    'payload',
    [
        {'name': '', 'primary_email': 'person@example.com'},
        {'name': 'Acme', 'primary_email': 'invalid'},
        {
            'name': 'Acme',
            'primary_email': 'contact@acme.example',
            'employees': [{'first_name': 'Ana', 'email': 'bad'}],
        },
    ],
)
def test_company_registration_rejects_invalid_data(payload):
    with pytest.raises(ValidationError):
        CompanyCreate.model_validate(payload)


def test_person_registration_rejects_invalid_email():
    with pytest.raises(ValidationError):
        PersonCreate.model_validate({
            'first_name': 'Ana',
            'last_name': 'Silva',
            'email': 'invalid',
            'phone': '+5511999999999',
        })
