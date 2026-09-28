import asyncio
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.enums.enums import Roles
from src.repositories.employee_repository import EmployeeRepository
from src.services.employee_service import EmployeeService


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
