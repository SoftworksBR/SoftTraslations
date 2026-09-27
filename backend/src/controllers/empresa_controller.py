from sqlalchemy.ext.asyncio import AsyncSession

from src.models.employee_model import Employee
from src.schemas.empresa_schema import EmpresaCriacao, FiltroEmpresa
from src.services.empresa_service import EmpresaService


class EmpresaController:
    @staticmethod
    async def criar(
        dados: EmpresaCriacao,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = EmpresaService(session)

        return await service.criar(dados, current_employee)

    @staticmethod
    async def buscar_por_id(
        empresa_id: int,
        session: AsyncSession,
        current_employee: Employee,
    ):
        service = EmpresaService(session)

        return await service.buscar_por_id(empresa_id, current_employee)

    @staticmethod
    async def listar(
        session: AsyncSession,
        current_employee: Employee,
        filtro: FiltroEmpresa,
    ):
        service = EmpresaService(session)

        return await service.listar(current_employee, filtro)
