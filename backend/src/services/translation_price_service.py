from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import Roles
from src.models.employee_model import Employee
from src.models.language_model import Language
from src.models.service_model import Service
from src.models.translation_price_model import TranslationPrice
from src.repositories.language_repository import LanguageRepository
from src.repositories.service_repository import ServiceRepository
from src.repositories.translation_price_repository import (
    TranslationPriceRepository,
)
from src.schemas.translation_price_schema import (
    TranslationPriceCreate,
    TranslationPriceUpdate,
)


class TranslationPriceService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = TranslationPriceRepository(session)
        self.language_repository = LanguageRepository(session)
        self.service_repository = ServiceRepository(session)

    @staticmethod
    def _require_admin(employee: Employee) -> None:
        if employee.role != Roles.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Somente administradores podem alterar preços.",
            )

    async def _validate_references(
        self,
        service_id: int,
        source_language_id: int,
        target_language_id: int,
    ) -> None:
        if source_language_id == target_language_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Os idiomas de origem e destino devem ser diferentes.",
            )

        service: Service | None = (
            await self.service_repository.get_by_id(service_id)
        )
        if service is None or not service.is_active:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Serviço inexistente ou inativo.",
            )

        source: Language | None = (
            await self.language_repository.get_by_id(source_language_id)
        )
        if source is None or not source.is_active:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Idioma de origem inexistente ou inativo.",
            )

        target: Language | None = (
            await self.language_repository.get_by_id(target_language_id)
        )
        if target is None or not target.is_active:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Idioma de destino inexistente ou inativo.",
            )

    async def create(
        self,
        data: TranslationPriceCreate,
        employee: Employee,
    ) -> TranslationPrice:
        self._require_admin(employee)

        await self._validate_references(
            data.service_id,
            data.source_language_id,
            data.target_language_id,
        )

        existing = await self.repository.get_by_combination(
            data.service_id,
            data.source_language_id,
            data.target_language_id,
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um preço para esse serviço e par de idiomas.",
            )

        price = TranslationPrice(
            service_id=data.service_id,
            source_language_id=data.source_language_id,
            target_language_id=data.target_language_id,
            price_per_word=data.price_per_word,
        )

        try:
            return await self.repository.create(price)
        except IntegrityError as exc:
            await self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um preço para esse serviço e par de idiomas.",
            ) from exc

    async def get_all(self) -> list[TranslationPrice]:
        prices = await self.repository.get_all()
        return [price for price in prices if price.is_active]

    async def update(
        self,
        price_id: int,
        data: TranslationPriceUpdate,
        employee: Employee,
    ) -> TranslationPrice:
        self._require_admin(employee)

        price = await self.repository.get_by_id(price_id)
        if price is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preço de tradução não encontrado.",
            )

        service_id = (
            data.service_id
            if data.service_id is not None
            else price.service_id
        )
        source_language_id = (
            data.source_language_id
            if data.source_language_id is not None
            else price.source_language_id
        )
        target_language_id = (
            data.target_language_id
            if data.target_language_id is not None
            else price.target_language_id
        )

        await self._validate_references(
            service_id,
            source_language_id,
            target_language_id,
        )

        existing = await self.repository.get_by_combination(
            service_id,
            source_language_id,
            target_language_id,
            exclude_id=price_id,
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um preço para esse serviço e par de idiomas.",
            )

        if data.service_id is not None:
            price.service_id = data.service_id
        if data.source_language_id is not None:
            price.source_language_id = data.source_language_id
        if data.target_language_id is not None:
            price.target_language_id = data.target_language_id
        if data.price_per_word is not None:
            price.price_per_word = data.price_per_word
        if data.is_active is not None:
            price.is_active = data.is_active

        try:
            return await self.repository.update(price)
        except IntegrityError as exc:
            await self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Não foi possível salvar esse preço por conflito de dados.",
            ) from exc
