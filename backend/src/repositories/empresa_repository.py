from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.empresa_model import Departamento, Empresa
from src.schemas.empresa_schema import FiltroEmpresa


class EmpresaRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    @staticmethod
    def _com_filhos(consulta):
        return consulta.options(
            selectinload(Empresa.departamentos).selectinload(
                Departamento.contatos
            )
        )

    async def criar(self, empresa: Empresa) -> Empresa:
        self.session.add(empresa)

        try:
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise

        return await self.buscar_por_id(empresa.id)

    async def buscar_por_cnpj(self, cnpj: str) -> Empresa | None:
        resultado = await self.session.execute(
            select(Empresa).where(Empresa.cnpj == cnpj)
        )

        return resultado.scalar_one_or_none()

    async def buscar_por_id(self, empresa_id: int) -> Empresa | None:
        resultado = await self.session.execute(
            self._com_filhos(select(Empresa).where(Empresa.id == empresa_id))
        )

        return resultado.scalar_one_or_none()

    async def listar(self, filtro: FiltroEmpresa) -> list[Empresa]:
        consulta = select(Empresa)

        if filtro.razao_social is not None:
            consulta = consulta.where(
                Empresa.razao_social.ilike(f'%{filtro.razao_social}%')
            )

        if filtro.cnpj is not None:
            consulta = consulta.where(Empresa.cnpj.ilike(f'%{filtro.cnpj}%'))

        resultado = await self.session.execute(
            self._com_filhos(
                consulta
                .order_by(Empresa.id)
                .offset(filtro.offset)
                .limit(filtro.limit)
            )
        )

        return list(resultado.scalars().all())
