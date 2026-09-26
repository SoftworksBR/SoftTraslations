from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import Roles
from src.models.employee_model import Employee
from src.models.empresa_model import Contato, Departamento, Empresa
from src.repositories.empresa_repository import EmpresaRepository
from src.schemas.empresa_schema import EmpresaCriacao, FiltroEmpresa


class EmpresaService:
    def __init__(self, session: AsyncSession):
        self.repository = EmpresaRepository(session)

    async def criar(
        self, dados: EmpresaCriacao, current_employee: Employee
    ) -> Empresa:
        self._exigir_cargo_atendimento(current_employee)

        if await self.repository.buscar_por_cnpj(dados.cnpj) is not None:
            raise self._cnpj_ja_cadastrado()

        empresa = Empresa(
            razao_social=dados.razao_social,
            cnpj=dados.cnpj,
            departamentos=[
                Departamento(
                    nome=departamento.nome,
                    contatos=[
                        Contato(
                            nome=contato.nome,
                            email=contato.email,
                            telefone=contato.telefone,
                            cargo=contato.cargo,
                        )
                        for contato in departamento.contatos
                    ],
                )
                for departamento in dados.departamentos
            ],
        )

        try:
            return await self.repository.criar(empresa)
        except IntegrityError:
            raise self._cnpj_ja_cadastrado() from None

    async def buscar_por_id(
        self, empresa_id: int, current_employee: Employee
    ) -> Empresa:
        self._exigir_cargo_atendimento(current_employee)

        empresa = await self.repository.buscar_por_id(empresa_id)

        if empresa is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Empresa não encontrada',
            )

        return empresa

    async def listar(
        self,
        current_employee: Employee,
        filtro: FiltroEmpresa,
    ) -> list[Empresa]:
        self._exigir_cargo_atendimento(current_employee)

        return await self.repository.listar(filtro)

    @staticmethod
    def _cnpj_ja_cadastrado() -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='Já existe uma empresa cadastrada com este CNPJ.',
        )

    @staticmethod
    def _exigir_cargo_atendimento(current_employee: Employee) -> None:
        if current_employee.role != Roles.ATENDIMENTO:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Apenas o atendimento pode gerenciar empresas',
            )
