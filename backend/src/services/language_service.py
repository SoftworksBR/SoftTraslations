from fastapi import HTTPException, status
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
        return await self.repository.create(language)

    async def get_all(self) -> list[Language]:
        languages = await self.repository.get_all()
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

        if data.code is not None:
            language.code = data.code

        if data.is_active is not None:
            language.is_active = data.is_active

        return await self.repository.update(language)
