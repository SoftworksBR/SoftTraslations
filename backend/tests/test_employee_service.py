import asyncio
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from src.enums.enums import EmployeeStatus, Roles, Status
from src.repositories.employee_repository import EmployeeRepository
from src.schemas.employee_schema import (
    EmployeeSchema,
    FreelancerPreRegistrationSchema,
    FreelancerProfileSchema,
)
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
        PathCreate(name='Translation', stage_ids=[])

    with pytest.raises(ValidationError):
        ProjectCreate(
            name='Website',
            status=Status.READY,
            creator_id=1,
            path_ids=[],
        )


def test_pre_registration_always_creates_pending_freelancer(monkeypatch):
    created_employees = []

    async def get_by_email_or_username(session, email=None, username=None):
        return None

    async def create(session, employee):
        created_employees.append(employee)
        return employee

    monkeypatch.setattr(
        EmployeeRepository,
        'get_by_email_or_username',
        get_by_email_or_username,
    )
    monkeypatch.setattr(EmployeeRepository, 'create', create)

    employee = asyncio.run(
        EmployeeService.pre_register_freelancer(
            session=None,
            data=FreelancerPreRegistrationSchema(
                email='new-freelancer@example.com', password='secret'
            ),
            current_employee=SimpleNamespace(role=Roles.PROJETOS),
        )
    )

    assert created_employees == [employee]
    assert employee.role == Roles.FREELANCER
    assert employee.status == EmployeeStatus.PENDING


def test_only_projects_role_can_pre_register_freelancers():
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            EmployeeService.pre_register_freelancer(
                session=None,
                data=FreelancerPreRegistrationSchema(
                    email='new-freelancer@example.com', password='secret'
                ),
                current_employee=SimpleNamespace(role=Roles.ADMIN),
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN


def test_completing_profile_changes_pending_to_available(monkeypatch):
    employee = SimpleNamespace(
        id=7,
        role=Roles.FREELANCER,
        status=EmployeeStatus.PENDING,
        username='freelancer@example.com',
    )

    async def get_by_id(session, employee_id):
        return employee

    async def update(session, updated_employee):
        return updated_employee

    monkeypatch.setattr(EmployeeRepository, 'get_by_id', get_by_id)
    monkeypatch.setattr(EmployeeRepository, 'update', update)

    updated_employee = asyncio.run(
        EmployeeService.complete_freelancer_profile(
            session=None,
            data=FreelancerProfileSchema(
                name='Freelancer Name',
            ),
            current_employee=employee,
        )
    )

    assert updated_employee.username == 'Freelancer Name'
    assert updated_employee.status == EmployeeStatus.AVAILABLE


def test_only_freelancers_can_complete_profile():
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            EmployeeService.complete_freelancer_profile(
                session=None,
                data=FreelancerProfileSchema(name='Someone'),
                current_employee=SimpleNamespace(
                    id=1,
                    role=Roles.PROJETOS,
                    status=EmployeeStatus.PENDING,
                ),
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN


def test_generic_employee_update_cannot_complete_pending_freelancer(
    monkeypatch,
):
    employee = SimpleNamespace(
        id=7,
        role=Roles.FREELANCER,
        status=EmployeeStatus.PENDING,
    )
    current_employee = SimpleNamespace(
        id=7,
        role=Roles.FREELANCER,
    )

    async def get_by_id(session, employee_id):
        return employee

    async def update(session, updated_employee):
        pytest.fail('Pending status must only change through profile route')

    monkeypatch.setattr(EmployeeRepository, 'get_by_id', get_by_id)
    monkeypatch.setattr(EmployeeRepository, 'update', update)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            EmployeeService.update_employee(
                session=None,
                employee_id=employee.id,
                employee=EmployeeSchema(
                    username='Freelancer Name',
                    email='freelancer@example.com',
                    password='secret',
                    role=Roles.FREELANCER,
                    status=EmployeeStatus.AVAILABLE,
                ),
                current_employee=current_employee,
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN


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
