from http import HTTPStatus
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.employee_controller import (
    accept_freelancer_invite,
    complete_freelancer_profile,
    create_employee,
    delete_employee,
    get_employees,
    pre_register_freelancer,
    update_employee,
)
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.employee_schema import (
    EmployeeCreate,
    EmployeeListSchema,
    EmployeePublicSchema,
    EmployeeSearchFilters,
    EmployeeUpdate,
    FreelancerInviteAcceptSchema,
    FreelancerInviteResponse,
    FreelancerPreRegistrationSchema,
    FreelancerProfileSchema,
)
from src.security import get_current_employee

public_router = APIRouter(
    prefix='/employee',
    tags=['Employees'],
)
protected_router = APIRouter(
    prefix='/employee',
    tags=['Employees'],
)


@public_router.post(
    '/freelancers/accept-invite',
    status_code=HTTPStatus.OK,
    response_model=EmployeePublicSchema,
)
async def accept_freelancer_invite_route(
    data: FreelancerInviteAcceptSchema,
    session: AsyncSession = Depends(get_session),
):
    return await accept_freelancer_invite(data, session)


@protected_router.post(
    '/freelancers/pre-register',
    status_code=HTTPStatus.CREATED,
    response_model=FreelancerInviteResponse,
)
async def pre_register_freelancer_route(
    data: FreelancerPreRegistrationSchema,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await pre_register_freelancer(
        data,
        session,
        current_employee,
    )


@protected_router.put(
    '/me/profile',
    status_code=HTTPStatus.OK,
    response_model=EmployeePublicSchema,
)
async def complete_freelancer_profile_route(
    data: FreelancerProfileSchema,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await complete_freelancer_profile(
        data,
        session,
        current_employee,
    )


@protected_router.get(
    '/',
    status_code=HTTPStatus.OK,
    response_model=EmployeeListSchema,
)
async def get_employees_route(
    filters: Annotated[EmployeeSearchFilters, Depends()],
    limit: int = 10,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await get_employees(
        limit,
        offset,
        session,
        current_employee,
        filters,
    )


@protected_router.post(
    '/',
    status_code=HTTPStatus.CREATED,
    response_model=EmployeePublicSchema,
)
async def create_employee_route(
    employee: EmployeeCreate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await create_employee(
        employee,
        session,
        current_employee,
    )


@protected_router.put(
    '/{employee_id}',
    status_code=HTTPStatus.OK,
    response_model=EmployeePublicSchema,
)
async def update_employee_route(
    employee_id: int,
    employee: EmployeeUpdate,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await update_employee(
        employee_id,
        employee,
        session,
        current_employee,
    )


@protected_router.delete(
    '/{employee_id}',
    status_code=HTTPStatus.NO_CONTENT,
)
async def delete_employee_route(
    employee_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    await delete_employee(
        employee_id,
        session,
        current_employee,
    )
