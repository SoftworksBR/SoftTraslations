from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import Roles
from src.models.employee_model import Employee
from src.models.language_model import Language
from src.repositories.language_repository import LanguageRepository
from src.schemas.language_schema import LanguageCreate, LanguageUpdate


class LanguageService:
    def __init__(self, session: AsyncSession):
        self.repository = LanguageRepository(session)

    @staticmethod
    def _require_admin(employee: Employee) -> None:
        if employee.role != Roles.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Somente administradores podem alterar idiomas.",
            )

    async def create(
        self,
        data: LanguageCreate,
        employee: Employee,
    ) -> Language:
        self._require_admin(employee)

        language = Language(
            name=data.name,
            code=data.code,
        )
        try:
            return await self.repository.create(language)
        except IntegrityError as exc:
            await self.repository.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um idioma com esse código.",
            ) from exc

    async def get_all(
        self,
        employee: Employee,
        include_inactive: bool = False,
    ) -> list[Language]:
        if include_inactive:
            self._require_admin(employee)
        languages = await self.repository.get_all()
        if include_inactive:
            return languages
        return [language for language in languages if language.is_active]

    async def update(
        self,
        language_id: int,
        data: LanguageUpdate,
        employee: Employee,
    ) -> Language:
        self._require_admin(employee)

        language = await self.repository.get_by_id(language_id)

        if language is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Idioma não encontrado.",
            )

        if data.name is not None:
            language.name = data.name

        if "code" in data.model_fields_set:
            language.code = data.code

        if data.is_active is not None:
            language.is_active = data.is_active

        try:
            return await self.repository.update(language)
        except IntegrityError as exc:
            await self.repository.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um idioma com esse código.",
            ) from exc
