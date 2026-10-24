import re
import secrets
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.enums import RequestStatus, Roles
from src.models.employee_model import Employee
from src.models.file_model import RequestFile
from src.models.request_model import Request
from src.repositories.language_repository import LanguageRepository
from src.repositories.quote_repository import QuoteRepository
from src.repositories.request_repository import RequestRepository
from src.repositories.service_repository import ServiceRepository
from src.schemas.request_schema import (
    PublicQuoteSummary,
    RequestCreate,
    RequestFileResponse,
    RequestOptionsResponse,
    RequestPublicResponse,
    RequestPublicUpdate,
    RequestResponse,
    RequestSearchFilters,
    RequestUpdate,
)
from src.settings import Settings

ALLOWED_EXTENSIONS = {
    '.pdf',
    '.doc',
    '.docx',
    '.odt',
    '.txt',
    '.rtf',
    '.xls',
    '.xlsx',
    '.png',
    '.jpg',
    '.jpeg',
}


class RequestService:
    def __init__(self, session: AsyncSession):
        self.repository = RequestRepository(session)
        self.language_repository = LanguageRepository(session)
        self.service_repository = ServiceRepository(session)
        self.quote_repository = QuoteRepository(session)

    # ------------------------------------------------------------------
    # Fluxo público (cliente, identificado pelo token da solicitação)
    # ------------------------------------------------------------------
    async def get_options(self) -> RequestOptionsResponse:
        languages = await self.language_repository.get_all()
        services = await self.service_repository.get_all()

        return RequestOptionsResponse(
            languages=[item for item in languages if item.is_active],
            services=[item for item in services if item.is_active],
        )

    async def create(self, data: RequestCreate) -> Request:
        await self._validate_references(
            data.service_id,
            data.source_language_id,
            data.target_language_id,
        )

        request = Request(
            username=data.username,
            email=data.email,
            phone=data.phone,
            company_name=data.company,
            source_language_id=data.source_language_id,
            target_language_id=data.target_language_id,
            public_token=secrets.token_urlsafe(24),
            service_id=data.service_id,
            observations=data.observations,
            word_count=data.word_count,
        )

        return await self.repository.create(request)

    async def get_public(self, token: str) -> RequestPublicResponse:
        request = await self._get_by_token(token)

        return await self._build_public_response(request)

    async def update_public(
        self, token: str, data: RequestPublicUpdate
    ) -> RequestPublicResponse:
        request = await self._get_by_token(token)
        self._require_pending(request)

        await self._apply_changes(request, data)
        request = await self.repository.update(request)

        return await self._build_public_response(request)

    async def delete_public(self, token: str) -> None:
        request = await self._get_by_token(token)
        self._require_pending(request)

        files = await self.repository.list_files(request.id)
        await self.repository.delete(request)

        for file in files:
            self._remove_from_disk(file.file_path)

    async def add_file_public(
        self, token: str, upload: UploadFile
    ) -> RequestFile:
        request = await self._get_by_token(token)
        self._require_pending(request)

        settings = Settings()
        current_files = await self.repository.list_files(request.id)
        if len(current_files) >= settings.MAX_FILES_PER_REQUEST:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    'Limite de '
                    f'{settings.MAX_FILES_PER_REQUEST} arquivos por '
                    'solicitação atingido'
                ),
            )

        original_name = self._clean_filename(upload.filename)
        extension = Path(original_name).suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Tipo de arquivo não permitido',
            )

        max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
        content = await upload.read(max_bytes + 1)
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f'Arquivo maior que {settings.MAX_UPLOAD_MB} MB',
            )
        if not content:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Arquivo vazio',
            )

        directory = Path(settings.UPLOAD_DIR) / 'requests' / str(request.id)
        directory.mkdir(parents=True, exist_ok=True)
        stored_path = directory / f'{secrets.token_hex(16)}{extension}'
        stored_path.write_bytes(content)

        return await self.repository.add_file(
            RequestFile(
                file_path=str(stored_path),
                original_name=original_name,
                request_id=request.id,
            )
        )

    # ------------------------------------------------------------------
    # Fluxo interno (funcionários)
    # ------------------------------------------------------------------
    async def get_by_id(self, request_id: int) -> Request:
        request = await self.repository.get_by_id(request_id)

        if request is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Solicitação não encontrada',
            )

        return request

    async def get_all(
        self,
        current_employee: Employee,
        filters: RequestSearchFilters,
    ) -> list[Request]:
        self._require_request_read_role(current_employee)

        return await self.repository.get_all(filters)

    async def update(
        self,
        request_id: int,
        data: RequestUpdate,
        current_employee: Employee,
    ) -> Request:
        self._require_atendimento_role(current_employee)
        request = await self.get_by_id(request_id)

        await self._apply_changes(request, data)

        if data.employee_id is not None:
            request.employee_id = data.employee_id

        if data.status is not None:
            request.status = data.status

        return await self.repository.update(request)

    async def delete(
        self,
        request_id: int,
        current_employee: Employee,
    ) -> None:
        self._require_atendimento_role(current_employee)
        request = await self.get_by_id(request_id)

        quote = await self.quote_repository.get_by_request_id(request.id)
        if quote is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='A solicitação possui orçamento e não pode ser '
                'excluída',
            )

        files = await self.repository.list_files(request.id)
        await self.repository.delete(request)

        for file in files:
            self._remove_from_disk(file.file_path)

    async def list_files(
        self, request_id: int, current_employee: Employee
    ) -> list[RequestFile]:
        self._require_request_read_role(current_employee)
        await self.get_by_id(request_id)

        return await self.repository.list_files(request_id)

    async def get_file(
        self, request_id: int, file_id: int, current_employee: Employee
    ) -> RequestFile:
        self._require_request_read_role(current_employee)

        file = await self.repository.get_file(request_id, file_id)
        if file is None or not Path(file.file_path).is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Arquivo não encontrado',
            )

        return file

    # ------------------------------------------------------------------
    # Auxiliares
    # ------------------------------------------------------------------
    async def _get_by_token(self, token: str) -> Request:
        request = await self.repository.get_by_public_token(token)

        if request is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Solicitação não encontrada',
            )

        return request

    async def _build_public_response(
        self, request: Request
    ) -> RequestPublicResponse:
        files = await self.repository.list_files(request.id)
        quote = await self.quote_repository.get_by_request_id(request.id)

        return RequestPublicResponse(
            **RequestResponse.model_validate(request).model_dump(),
            public_token=request.public_token,
            files=[RequestFileResponse.model_validate(f) for f in files],
            quote=(
                PublicQuoteSummary.model_validate(quote)
                if quote is not None
                else None
            ),
        )

    async def _apply_changes(
        self, request: Request, data: RequestPublicUpdate
    ) -> None:
        service_id = data.service_id or request.service_id
        source_id = data.source_language_id or request.source_language_id
        target_id = data.target_language_id or request.target_language_id

        if (
            data.service_id is not None
            or data.source_language_id is not None
            or data.target_language_id is not None
        ):
            await self._validate_references(service_id, source_id, target_id)

        for field in (
            'username',
            'email',
            'phone',
            'source_language_id',
            'target_language_id',
            'service_id',
            'observations',
            'word_count',
        ):
            value = getattr(data, field)
            if value is not None:
                setattr(request, field, value)
        if data.company is not None:
            request.company_name = data.company

    async def _validate_references(
        self,
        service_id: int | None,
        source_language_id: int,
        target_language_id: int,
    ) -> None:
        if source_language_id == target_language_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Os idiomas de origem e destino devem ser diferentes',
            )

        for language_id in (source_language_id, target_language_id):
            language = await self.language_repository.get_by_id(language_id)
            if language is None or not language.is_active:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail='Idioma inexistente ou inativo',
                )

        service = (
            await self.service_repository.get_by_id(service_id)
            if service_id is not None
            else None
        )
        if service is None or not service.is_active:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail='Serviço inexistente ou inativo',
            )

    @staticmethod
    def _require_pending(request: Request) -> None:
        if request.status != RequestStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='A solicitação já foi analisada e não pode mais '
                'ser alterada',
            )

    @staticmethod
    def _clean_filename(filename: str | None) -> str:
        name = Path(filename or 'arquivo').name
        name = re.sub(r'[^\w.\- ]', '_', name).strip()

        return name[:150] or 'arquivo'

    @staticmethod
    def _remove_from_disk(file_path: str) -> None:
        try:
            Path(file_path).unlink(missing_ok=True)
        except OSError:
            pass

    @staticmethod
    def _require_request_read_role(current_employee: Employee) -> None:
        if current_employee.role not in {
            Roles.ATENDIMENTO,
            Roles.PROJETOS,
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only atendimento and projetos can read requests',
            )

    @staticmethod
    def _require_atendimento_role(current_employee: Employee) -> None:
        if current_employee.role != Roles.ATENDIMENTO:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Only atendimento can use this endpoint',
            )
