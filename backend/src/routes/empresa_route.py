from http import HTTPStatus
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.controllers.empresa_controller import EmpresaController
from src.database import get_session
from src.models.employee_model import Employee
from src.schemas.empresa_schema import (
    EmpresaCriacao,
    EmpresaResposta,
    FiltroEmpresa,
)
from src.security import get_current_employee

router = APIRouter(
    prefix='/empresas',
    tags=['Empresas'],
)


@router.post(
    '/',
    status_code=HTTPStatus.CREATED,
    response_model=EmpresaResposta,
)
async def criar_empresa(
    dados: EmpresaCriacao,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await EmpresaController.criar(dados, session, current_employee)


@router.get('/', response_model=list[EmpresaResposta])
async def listar_empresas(
    filtro: Annotated[FiltroEmpresa, Query()],
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await EmpresaController.listar(session, current_employee, filtro)


@router.get('/{empresa_id}', response_model=EmpresaResposta)
async def buscar_empresa(
    empresa_id: int,
    session: AsyncSession = Depends(get_session),
    current_employee: Employee = Depends(get_current_employee),
):
    return await EmpresaController.buscar_por_id(
        empresa_id, session, current_employee
    )
