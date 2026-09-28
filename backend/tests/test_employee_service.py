import asyncio
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from src.enums.enums import EmployeeStatus, Roles, Status
from src.repositories.employee_repository import EmployeeRepository
from src.schemas.employee_schema import EmployeeSchema
from src.schemas.path_schema import PathCreate
from src.schemas.project_schema import ProjectCreate
from src.services.employee_service import EmployeeService


def test_pending_status_is_only_valid_for_freelancers():
    employee = EmployeeSchema(
        username='translator',
        email='translator@example.com',
        password='password',
        role=Roles.FREELANCER,
        status=EmployeeStatus.PENDING,
    )

    assert employee.status == EmployeeStatus.PENDING

    with pytest.raises(ValidationError):
        EmployeeSchema(
            username='staff',
            email='staff@example.com',
            password='password',
            role=Roles.ATENDIMENTO,
            status=EmployeeStatus.PENDING,
        )


def test_path_and_project_require_at_least_one_related_record():
    with pytest.raises(ValidationError):
        PathCreate(name='Translation', stages=[])

    with pytest.raises(ValidationError):
        ProjectCreate(
            name='Website',
            status=Status.READY,
            creator_id=1,
            path_ids=[],
        )


def test_admin_nao_pode_excluir_outro_admin(monkeypatch):
    target_employee = SimpleNamespace(id=2, role=Roles.ADMIN)
    current_employee = SimpleNamespace(id=1, role=Roles.ADMIN)

    async def get_by_id(session, employee_id):
        return target_employee

    async def delete(session, employee):
        pytest.fail('A conta de outro admin não deve ser excluída')

    monkeypatch.setattr(EmployeeRepository, 'get_by_id', get_by_id)
    monkeypatch.setattr(EmployeeRepository, 'delete', delete)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            EmployeeService.delete_employee(
                session=None,
                employee_id=target_employee.id,
                current_employee=current_employee,
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN
    assert error.value.detail == 'Admins cannot delete other admins'


def test_admin_pode_excluir_funcionario_nao_admin(monkeypatch):
    target_employee = SimpleNamespace(id=2, role=Roles.ATENDIMENTO)
    current_employee = SimpleNamespace(id=1, role=Roles.ADMIN)
    deleted_employees = []

    async def get_by_id(session, employee_id):
        return target_employee

    async def delete(session, employee):
        deleted_employees.append(employee)

    monkeypatch.setattr(EmployeeRepository, 'get_by_id', get_by_id)
    monkeypatch.setattr(EmployeeRepository, 'delete', delete)

    asyncio.run(
        EmployeeService.delete_employee(
            session=None,
            employee_id=target_employee.id,
            current_employee=current_employee,
        )
    )

    assert deleted_employees == [target_employee]


def test_cria_admin_inicial_quando_nao_existem_funcionarios(monkeypatch):
    employee = EmployeeSchema(
        username='admin',
        email='admin@admin.com',
        password='admin123',
        role=Roles.ADMIN,
    )
    created_employees = []

    async def get_employees(session, limit, offset, role=None):
        return []

    async def get_by_email_or_username(session, email, username):
        return None

    async def create(session, db_employee):
        created_employees.append(db_employee)
        return db_employee

    monkeypatch.setattr(EmployeeRepository, 'get_employees', get_employees)
    monkeypatch.setattr(
        EmployeeRepository,
        'get_by_email_or_username',
        get_by_email_or_username,
    )
    monkeypatch.setattr(EmployeeRepository, 'create', create)

    created_employee = asyncio.run(
        EmployeeService.create_initial_admin(session=None, employee=employee)
    )

    assert created_employees == [created_employee]
    assert created_employee.role == Roles.ADMIN


def test_nao_cria_admin_inicial_se_ja_existir_funcionario(monkeypatch):
    employee = EmployeeSchema(
        username='admin',
        email='admin@admin.com',
        password='admin123',
        role=Roles.ADMIN,
    )

    async def get_employees(session, limit, offset, role=None):
        return [object()]

    monkeypatch.setattr(EmployeeRepository, 'get_employees', get_employees)

    with pytest.raises(ValueError, match='Initial admin already registered'):
        asyncio.run(
            EmployeeService.create_initial_admin(
                session=None,
                employee=employee,
            )
        )
