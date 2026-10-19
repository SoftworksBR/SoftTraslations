import asyncio
from datetime import date, datetime, timedelta
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from src.enums.enums import EmployeeStatus, Roles, Status
from src.repositories.employee_repository import EmployeeRepository
from src.schemas.employee_schema import (
    EmployeeCreate,
    EmployeeSearchFilters,
    EmployeeUpdate,
    FreelancerInviteAcceptSchema,
    FreelancerPreRegistrationSchema,
    FreelancerProfileSchema,
)
from src.schemas.path_schema import PathCreate
from src.schemas.project_schema import ProjectCreate
from src.services.employee_service import EmployeeService


def test_pending_status_is_only_valid_for_freelancers():
    employee = EmployeeCreate(
        first_name='Translator',
        last_name='Example',
        email='translator@example.com',
        password='password',
        role=Roles.FREELANCER,
        status=EmployeeStatus.PENDING,
    )

    assert employee.status == EmployeeStatus.PENDING

    with pytest.raises(ValidationError):
        EmployeeCreate(
            first_name='Staff',
            last_name='Example',
            email='staff@example.com',
            password='password',
            role=Roles.ATENDIMENTO,
            status=EmployeeStatus.PENDING,
        )


def test_employee_create_requires_non_empty_last_name():
    with pytest.raises(ValidationError):
        EmployeeCreate(
            first_name='Staff',
            last_name='',
            email='staff@example.com',
            password='password',
            role=Roles.ATENDIMENTO,
        )


def test_employee_update_allows_empty_last_name():
    employee = EmployeeUpdate(
        first_name='Staff',
        last_name='',
        email='staff@example.com',
        password='password',
        role=Roles.ATENDIMENTO,
    )

    assert not employee.last_name


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

    async def get_by_email(session, email):
        return None

    async def create(session, employee):
        created_employees.append(employee)
        return employee

    monkeypatch.setattr(EmployeeRepository, 'get_by_email', get_by_email)
    monkeypatch.setattr(EmployeeRepository, 'create', create)

    employee = asyncio.run(
        EmployeeService.pre_register_freelancer(
            session=None,
            data=FreelancerPreRegistrationSchema(
                first_name='New',
                last_name='Freelancer',
                email='new-freelancer@example.com',
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
                    first_name='New',
                    last_name='Freelancer',
                    email='new-freelancer@example.com',
                ),
                current_employee=SimpleNamespace(role=Roles.ADMIN),
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN


def test_pre_registration_generates_single_use_invite_token(monkeypatch):
    async def get_by_email(session, email):
        return None

    async def create(session, employee):
        return employee

    monkeypatch.setattr(EmployeeRepository, 'get_by_email', get_by_email)
    monkeypatch.setattr(EmployeeRepository, 'create', create)

    employee = asyncio.run(
        EmployeeService.pre_register_freelancer(
            session=None,
            data=FreelancerPreRegistrationSchema(
                first_name='New',
                last_name='Freelancer',
                email='new-freelancer@example.com',
            ),
            current_employee=SimpleNamespace(role=Roles.PROJETOS),
        )
    )

    assert employee.invite_token
    assert employee.invite_token_expires_at > datetime.now()
    # A senha nunca foi informada pelo gestor; vira um hash inutilizavel
    # ate o freelancer aceitar o convite e definir a propria senha.
    assert employee.password


def test_accept_invite_sets_password_and_clears_token(monkeypatch):
    employee = SimpleNamespace(
        id=9,
        password='old-hash',
        invite_token='valid-token',
        invite_token_expires_at=datetime.now() + timedelta(days=1),
    )

    async def get_by_invite_token(session, invite_token):
        return employee if invite_token == 'valid-token' else None

    async def update(session, updated_employee):
        return updated_employee

    monkeypatch.setattr(
        EmployeeRepository, 'get_by_invite_token', get_by_invite_token
    )
    monkeypatch.setattr(EmployeeRepository, 'update', update)

    updated_employee = asyncio.run(
        EmployeeService.accept_freelancer_invite(
            session=None,
            data=FreelancerInviteAcceptSchema(
                token='valid-token', password='novaSenha123'
            ),
        )
    )

    assert updated_employee.password != 'old-hash'
    assert updated_employee.invite_token is None
    assert updated_employee.invite_token_expires_at is None


def test_accept_invite_rejects_unknown_token(monkeypatch):
    async def get_by_invite_token(session, invite_token):
        return None

    monkeypatch.setattr(
        EmployeeRepository, 'get_by_invite_token', get_by_invite_token
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            EmployeeService.accept_freelancer_invite(
                session=None,
                data=FreelancerInviteAcceptSchema(
                    token='unknown', password='novaSenha123'
                ),
            )
        )

    assert error.value.status_code == HTTPStatus.NOT_FOUND


def test_accept_invite_rejects_expired_token(monkeypatch):
    employee = SimpleNamespace(
        id=9,
        password='old-hash',
        invite_token='expired-token',
        invite_token_expires_at=datetime.now() - timedelta(days=1),
    )

    async def get_by_invite_token(session, invite_token):
        return employee

    monkeypatch.setattr(
        EmployeeRepository, 'get_by_invite_token', get_by_invite_token
    )

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            EmployeeService.accept_freelancer_invite(
                session=None,
                data=FreelancerInviteAcceptSchema(
                    token='expired-token', password='novaSenha123'
                ),
            )
        )

    assert error.value.status_code == HTTPStatus.GONE
    assert employee.password == 'old-hash'


def test_completing_profile_changes_pending_to_available(monkeypatch):
    employee = SimpleNamespace(
        id=7,
        role=Roles.FREELANCER,
        status=EmployeeStatus.PENDING,
        first_name='freelancer@example.com',
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

    assert updated_employee.first_name == 'Freelancer Name'
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
                employee=EmployeeUpdate(
                    first_name='Freelancer',
                    last_name='Name',
                    email='freelancer@example.com',
                    password='secret',
                    role=Roles.FREELANCER,
                    status=EmployeeStatus.AVAILABLE,
                ),
                current_employee=current_employee,
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN


def _freelancer_with_private_data():
    return SimpleNamespace(
        id=5,
        first_name='Ana',
        last_name='Silva',
        email='ana@example.com',
        role=Roles.FREELANCER,
        status=EmployeeStatus.AVAILABLE,
        birth_date=date(1990, 1, 1),
        phone='11999990000',
        photo_path=None,
    )


def test_phone_and_birth_date_hidden_from_other_viewers_in_listing(
    monkeypatch,
):
    target = _freelancer_with_private_data()

    async def get_employees(session, limit, offset, filters=None):
        return [target]

    monkeypatch.setattr(EmployeeRepository, 'get_employees', get_employees)

    result = asyncio.run(
        EmployeeService.get_employees(
            session=None,
            limit=10,
            offset=0,
            current_employee=SimpleNamespace(id=1, role=Roles.PROJETOS),
            filters=EmployeeSearchFilters(),
        )
    )

    assert result[0].phone is None
    assert result[0].birth_date is None
    # Campos não privados continuam visíveis normalmente.
    assert result[0].first_name == 'Ana'
    assert result[0].email == 'ana@example.com'


def test_phone_and_birth_date_visible_to_admin_in_listing(monkeypatch):
    target = _freelancer_with_private_data()

    async def get_employees(session, limit, offset, filters=None):
        return [target]

    monkeypatch.setattr(EmployeeRepository, 'get_employees', get_employees)

    result = asyncio.run(
        EmployeeService.get_employees(
            session=None,
            limit=10,
            offset=0,
            current_employee=SimpleNamespace(id=1, role=Roles.ADMIN),
            filters=EmployeeSearchFilters(),
        )
    )

    assert result[0].phone == '11999990000'
    assert result[0].birth_date == date(1990, 1, 1)


def test_phone_and_birth_date_visible_to_the_employee_themselves():
    target = _freelancer_with_private_data()

    public_schema = EmployeeService._to_public_schema(target, target)

    assert public_schema.phone == '11999990000'
    assert public_schema.birth_date == date(1990, 1, 1)


def test_non_admin_cannot_update_another_employees_profile():
    current_employee = SimpleNamespace(id=1, role=Roles.ATENDIMENTO)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            EmployeeService.update_employee(
                session=None,
                employee_id=2,
                employee=EmployeeUpdate(
                    first_name='Someone',
                    last_name='Else',
                    email='someone@example.com',
                    password='secret',
                    role=Roles.ATENDIMENTO,
                ),
                current_employee=current_employee,
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN
    assert error.value.detail == 'You can only update your own employee'


def test_update_employee_only_applies_provided_optional_profile_fields(
    monkeypatch,
):
    target_employee = SimpleNamespace(
        id=3,
        role=Roles.ATENDIMENTO,
        status=EmployeeStatus.AVAILABLE,
        first_name='Old',
        last_name='Name',
        email='old@example.com',
        password='old-hash',
        birth_date=None,
        phone='1111-1111',
        photo_path=None,
    )

    async def get_by_id(session, employee_id):
        return target_employee

    async def update(session, updated_employee):
        return updated_employee

    monkeypatch.setattr(EmployeeRepository, 'get_by_id', get_by_id)
    monkeypatch.setattr(EmployeeRepository, 'update', update)

    updated_employee = asyncio.run(
        EmployeeService.update_employee(
            session=None,
            employee_id=target_employee.id,
            employee=EmployeeUpdate(
                first_name='Old',
                last_name='Name',
                email='old@example.com',
                password='old-hash',
                role=Roles.ATENDIMENTO,
                status=EmployeeStatus.AVAILABLE,
                photo_path='/uploads/photo.png',
            ),
            current_employee=SimpleNamespace(
                id=target_employee.id, role=Roles.ATENDIMENTO
            ),
        )
    )

    assert updated_employee.photo_path == '/uploads/photo.png'
    assert updated_employee.phone == '1111-1111'
    assert updated_employee.birth_date is None


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
    employee = EmployeeCreate(
        first_name='Admin',
        last_name='Admin',
        email='admin@admin.com',
        password='admin123',
        role=Roles.ADMIN,
    )
    created_employees = []

    async def get_employees(session, limit, offset, role=None):
        return []

    async def get_by_email(session, email):
        return None

    async def create(session, db_employee):
        created_employees.append(db_employee)
        return db_employee

    monkeypatch.setattr(EmployeeRepository, 'get_employees', get_employees)
    monkeypatch.setattr(EmployeeRepository, 'get_by_email', get_by_email)
    monkeypatch.setattr(EmployeeRepository, 'create', create)

    created_employee = asyncio.run(
        EmployeeService.create_initial_admin(session=None, employee=employee)
    )

    assert created_employees == [created_employee]
    assert created_employee.role == Roles.ADMIN


def test_nao_cria_admin_inicial_se_ja_existir_funcionario(monkeypatch):
    employee = EmployeeCreate(
        first_name='Admin',
        last_name='Admin',
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


def test_duplicate_check_on_create_uses_only_email(monkeypatch):
    existing = SimpleNamespace(email='taken@example.com')

    async def get_by_email(session, email):
        return existing if email == 'taken@example.com' else None

    monkeypatch.setattr(EmployeeRepository, 'get_by_email', get_by_email)

    with pytest.raises(ValueError, match='Email already registered'):
        asyncio.run(
            EmployeeService.create_employee(
                session=None,
                employee=EmployeeCreate(
                    first_name='Someone',
                    last_name='Else',
                    email='taken@example.com',
                    password='secret',
                    role=Roles.ATENDIMENTO,
                ),
                current_employee=SimpleNamespace(role=Roles.ADMIN),
            )
        )
