import asyncio
import hashlib
from datetime import date, datetime, timedelta
from http import HTTPStatus
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.dialects import postgresql

from src.enums.enums import EmployeeStatus, Roles, Status
from src.repositories.employee_repository import EmployeeRepository
from src.schemas.employee_schema import (
    EmployeeCreate,
    EmployeePublicSchema,
    EmployeeSearchFilters,
    EmployeeUpdate,
    FreelancerInviteAcceptSchema,
    FreelancerPreRegistrationSchema,
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
        employee.id = 1
        created_employees.append(employee)
        return employee

    monkeypatch.setattr(EmployeeRepository, 'get_by_email', get_by_email)
    monkeypatch.setattr(EmployeeRepository, 'create', create)

    response = asyncio.run(
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

    assert len(created_employees) == 1
    created_employee = created_employees[0]
    assert created_employee.role == Roles.FREELANCER
    assert created_employee.status == EmployeeStatus.PENDING
    assert response.id == created_employee.id
    assert response.email == created_employee.email


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
    created_employees = []

    async def get_by_email(session, email):
        return None

    async def create(session, employee):
        employee.id = 1
        created_employees.append(employee)
        return employee

    monkeypatch.setattr(EmployeeRepository, 'get_by_email', get_by_email)
    monkeypatch.setattr(EmployeeRepository, 'create', create)

    response = asyncio.run(
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

    created_employee = created_employees[0]

    # A resposta traz o token puro (para o gestor repassar); o banco só
    # guarda o hash dele, nunca o valor puro.
    assert response.invite_token
    assert created_employee.invite_token_hash
    assert created_employee.invite_token_hash != response.invite_token
    assert (
        created_employee.invite_token_hash
        == hashlib.sha256(response.invite_token.encode()).hexdigest()
    )
    assert created_employee.invite_token_expires_at > datetime.now()
    # A senha nunca foi informada pelo gestor; vira um hash inutilizavel
    # ate o freelancer aceitar o convite e definir a propria senha.
    assert created_employee.password


def test_accept_invite_sets_password_and_clears_token(monkeypatch):
    valid_token_hash = hashlib.sha256(b'valid-token').hexdigest()
    employee = SimpleNamespace(
        id=9,
        password='old-hash',
        invite_token_hash=valid_token_hash,
        invite_token_expires_at=datetime.now() + timedelta(days=1),
    )

    async def get_by_invite_token_hash(session, invite_token_hash):
        return employee if invite_token_hash == valid_token_hash else None

    async def consume_invite_token(
        session, employee_id, invite_token_hash, password_hash
    ):
        employee.password = password_hash
        employee.invite_token_hash = None
        employee.invite_token_expires_at = None
        return employee

    monkeypatch.setattr(
        EmployeeRepository,
        'get_by_invite_token_hash',
        get_by_invite_token_hash,
    )
    monkeypatch.setattr(
        EmployeeRepository, 'consume_invite_token', consume_invite_token
    )

    updated_employee = asyncio.run(
        EmployeeService.accept_freelancer_invite(
            session=None,
            data=FreelancerInviteAcceptSchema(
                token='valid-token', password='novaSenha123'
            ),
        )
    )

    assert updated_employee.password != 'old-hash'
    assert updated_employee.invite_token_hash is None
    assert updated_employee.invite_token_expires_at is None


def test_accept_invite_rejects_unknown_token(monkeypatch):
    async def get_by_invite_token_hash(session, invite_token_hash):
        return None

    monkeypatch.setattr(
        EmployeeRepository,
        'get_by_invite_token_hash',
        get_by_invite_token_hash,
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
        invite_token_hash=hashlib.sha256(b'expired-token').hexdigest(),
        invite_token_expires_at=datetime.now() - timedelta(days=1),
    )

    async def get_by_invite_token_hash(session, invite_token_hash):
        return employee

    monkeypatch.setattr(
        EmployeeRepository,
        'get_by_invite_token_hash',
        get_by_invite_token_hash,
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


def test_invite_token_hash_is_never_part_of_the_public_schema():
    assert 'invite_token' not in EmployeePublicSchema.model_fields
    assert 'invite_token_hash' not in EmployeePublicSchema.model_fields


def test_listing_response_never_leaks_the_invite_token_hash(monkeypatch):
    employee_with_pending_invite = SimpleNamespace(
        id=1,
        first_name='Ana',
        last_name='Silva',
        email='ana@example.com',
        role=Roles.FREELANCER,
        status=EmployeeStatus.PENDING,
        birth_date=None,
        phone=None,
        photo_path=None,
        invite_token_hash='super-secret-hash',
    )

    async def get_employees(session, limit, offset, filters=None):
        return [employee_with_pending_invite]

    monkeypatch.setattr(EmployeeRepository, 'get_employees', get_employees)

    result = asyncio.run(
        EmployeeService.get_employees(
            session=None,
            limit=10,
            offset=0,
            current_employee=SimpleNamespace(id=99, role=Roles.ADMIN),
            filters=EmployeeSearchFilters(),
        )
    )

    serialized = result[0].model_dump()
    assert 'invite_token' not in serialized
    assert 'invite_token_hash' not in serialized
    assert 'super-secret-hash' not in str(serialized)


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


def test_non_admin_cannot_change_their_own_role(monkeypatch):
    target_employee = SimpleNamespace(
        id=4,
        role=Roles.FREELANCER,
        status=EmployeeStatus.AVAILABLE,
    )

    async def get_by_id(session, employee_id):
        return target_employee

    async def update(session, updated_employee):
        pytest.fail('Role change by a non-admin must not be persisted')

    monkeypatch.setattr(EmployeeRepository, 'get_by_id', get_by_id)
    monkeypatch.setattr(EmployeeRepository, 'update', update)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            EmployeeService.update_employee(
                session=None,
                employee_id=target_employee.id,
                employee=EmployeeUpdate(
                    first_name='Freelancer',
                    last_name='Name',
                    email='freelancer@example.com',
                    password='secret',
                    role=Roles.ADMIN,
                    status=EmployeeStatus.AVAILABLE,
                ),
                current_employee=SimpleNamespace(
                    id=target_employee.id, role=Roles.FREELANCER
                ),
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN
    assert target_employee.role == Roles.FREELANCER


@pytest.mark.parametrize(
    'requested_status',
    [{'status': EmployeeStatus.AVAILABLE}, {}],
    ids=['explicit_available', 'omitted_status_defaults_to_available'],
)
def test_freelancer_under_review_cannot_approve_themselves(
    monkeypatch, requested_status
):
    target_employee = SimpleNamespace(
        id=8,
        role=Roles.FREELANCER,
        status=EmployeeStatus.UNDER_REVIEW,
    )

    async def get_by_id(session, employee_id):
        return target_employee

    async def update(session, updated_employee):
        pytest.fail('Freelancer must not leave under_review by themselves')

    monkeypatch.setattr(EmployeeRepository, 'get_by_id', get_by_id)
    monkeypatch.setattr(EmployeeRepository, 'update', update)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            EmployeeService.update_employee(
                session=None,
                employee_id=target_employee.id,
                employee=EmployeeUpdate(
                    first_name='Freelancer',
                    last_name='Name',
                    email='freelancer@example.com',
                    password='secret',
                    role=Roles.FREELANCER,
                    **requested_status,
                ),
                current_employee=SimpleNamespace(
                    id=target_employee.id, role=Roles.FREELANCER
                ),
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN
    assert target_employee.status == EmployeeStatus.UNDER_REVIEW


def test_concurrent_invite_acceptance_consumes_token_only_once(monkeypatch):
    valid_token_hash = hashlib.sha256(b'valid-token').hexdigest()
    employee = SimpleNamespace(
        id=9,
        password='old-hash',
        invite_token_hash=valid_token_hash,
        invite_token_expires_at=datetime.now() + timedelta(days=1),
    )
    persisted_passwords = []

    async def get_by_invite_token_hash(session, invite_token_hash):
        # Cada requisição tem a própria sessão, então recebe a sua cópia
        # da linha lida do banco.
        found = (
            SimpleNamespace(**vars(employee))
            if employee.invite_token_hash == invite_token_hash
            else None
        )
        # Cede o loop para as duas requisições lerem o token antes de
        # qualquer uma gravar, como acontece com acessos simultâneos.
        await asyncio.sleep(0)
        return found

    async def update(session, updated_employee):
        persisted_passwords.append(updated_employee.password)
        return updated_employee

    async def consume_invite_token(
        session, employee_id, invite_token_hash, password_hash
    ):
        # Simula o UPDATE condicional do banco: só a primeira requisição
        # ainda encontra o hash gravado.
        if employee.invite_token_hash != invite_token_hash:
            return None
        employee.password = password_hash
        employee.invite_token_hash = None
        employee.invite_token_expires_at = None
        persisted_passwords.append(password_hash)
        return employee

    monkeypatch.setattr(
        EmployeeRepository,
        'get_by_invite_token_hash',
        get_by_invite_token_hash,
    )
    monkeypatch.setattr(EmployeeRepository, 'update', update)
    monkeypatch.setattr(
        EmployeeRepository,
        'consume_invite_token',
        consume_invite_token,
        raising=False,
    )

    async def accept_twice():
        return await asyncio.gather(
            EmployeeService.accept_freelancer_invite(
                session=None,
                data=FreelancerInviteAcceptSchema(
                    token='valid-token', password='primeiraSenha1'
                ),
            ),
            EmployeeService.accept_freelancer_invite(
                session=None,
                data=FreelancerInviteAcceptSchema(
                    token='valid-token', password='segundaSenha2'
                ),
            ),
            return_exceptions=True,
        )

    results = asyncio.run(accept_twice())

    errors = [result for result in results if isinstance(result, Exception)]
    assert len(persisted_passwords) == 1
    assert len(errors) == 1
    assert isinstance(errors[0], HTTPException)
    assert errors[0].status_code == HTTPStatus.NOT_FOUND


def test_consume_invite_token_is_a_conditional_update_on_the_token_hash():
    session = SimpleNamespace(
        scalar=AsyncMock(return_value=None),
        commit=AsyncMock(),
    )

    consumed = asyncio.run(
        EmployeeRepository.consume_invite_token(
            session,
            employee_id=9,
            invite_token_hash='token-hash',
            password_hash='new-hash',
        )
    )

    statement = session.scalar.await_args.args[0]
    query = str(statement.compile(dialect=postgresql.dialect())).lower()
    assert consumed is None
    assert query.startswith('update employees set')
    assert 'employees.id =' in query
    assert 'employees.invite_token_hash =' in query
    assert 'returning' in query
    session.commit.assert_awaited_once()


def test_update_employee_clears_optional_fields_sent_as_null(monkeypatch):
    target_employee = SimpleNamespace(
        id=3,
        role=Roles.ATENDIMENTO,
        status=EmployeeStatus.AVAILABLE,
        first_name='Old',
        last_name='Name',
        email='old@example.com',
        password='old-hash',
        birth_date=date(1990, 1, 1),
        phone='1111-1111',
        photo_path='/uploads/photo.png',
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
                birth_date=None,
                phone=None,
                photo_path=None,
            ),
            current_employee=SimpleNamespace(
                id=target_employee.id, role=Roles.ATENDIMENTO
            ),
        )
    )

    assert updated_employee.birth_date is None
    assert updated_employee.phone is None
    assert updated_employee.photo_path is None
