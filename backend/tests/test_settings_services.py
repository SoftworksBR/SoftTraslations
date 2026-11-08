import asyncio
from http import HTTPStatus
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.enums.enums import Roles
from src.repositories.language_repository import LanguageRepository
from src.repositories.service_repository import ServiceRepository
from src.repositories.translation_price_repository import TranslationPriceRepository
from src.services.language_service import LanguageService
from src.services.service_service import ServiceService
from src.services.translation_price_service import TranslationPriceService


@pytest.mark.parametrize(
    ("service_class", "repository_class", "active_attribute"),
    [
        (LanguageService, LanguageRepository, "is_active"),
        (ServiceService, ServiceRepository, "is_active"),
        (TranslationPriceService, TranslationPriceRepository, "is_active"),
    ],
)
def test_catalog_lists_include_inactive_items_for_admins(
    monkeypatch,
    service_class,
    repository_class,
    active_attribute,
):
    items = [
        SimpleNamespace(**{active_attribute: True}),
        SimpleNamespace(**{active_attribute: False}),
    ]

    async def get_all(_repository):
        return items

    monkeypatch.setattr(repository_class, "get_all", get_all)
    result = asyncio.run(
        service_class(None).get_all(
            SimpleNamespace(role=Roles.ADMIN),
            include_inactive=True,
        )
    )

    assert result == items


@pytest.mark.parametrize(
    ("service_class", "repository_class"),
    [
        (LanguageService, LanguageRepository),
        (ServiceService, ServiceRepository),
        (TranslationPriceService, TranslationPriceRepository),
    ],
)
def test_catalog_lists_restrict_inactive_items_for_non_admins(
    monkeypatch,
    service_class,
    repository_class,
):
    items = [
        SimpleNamespace(is_active=True),
        SimpleNamespace(is_active=False),
    ]

    async def get_all(_repository):
        return items

    monkeypatch.setattr(repository_class, "get_all", get_all)
    result = asyncio.run(
        service_class(None).get_all(
            SimpleNamespace(role=Roles.PROJETOS),
            include_inactive=False,
        )
    )

    assert result == [items[0]]


@pytest.mark.parametrize(
    ("service_class", "repository_class"),
    [
        (LanguageService, LanguageRepository),
        (ServiceService, ServiceRepository),
        (TranslationPriceService, TranslationPriceRepository),
    ],
)
def test_only_admins_can_request_inactive_catalog_items(
    monkeypatch,
    service_class,
    repository_class,
):
    async def get_all(_repository):
        pytest.fail("Repository must not be queried for unauthorized access")

    monkeypatch.setattr(repository_class, "get_all", get_all)
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            service_class(None).get_all(
                SimpleNamespace(role=Roles.PROJETOS),
                include_inactive=True,
            )
        )

    assert error.value.status_code == HTTPStatus.FORBIDDEN
