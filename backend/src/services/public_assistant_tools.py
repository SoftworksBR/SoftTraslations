from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import aliased

from src.database import AsyncSessionLocal
from src.models.language_model import Language
from src.models.service_model import Service
from src.models.translation_price_model import TranslationPrice


async def listar_servicos_disponiveis() -> dict:
    """Lista os serviços de tradução atualmente disponíveis para clientes."""

    async with AsyncSessionLocal() as session:
        result = await session.scalars(
            select(Service)
            .where(Service.is_active.is_(True))
            .order_by(Service.name)
        )

        services = result.all()

        return {
            "servicos": [
                {
                    "nome": service.name,
                    "descricao": service.description,
                }
                for service in services
            ]
        }


async def listar_idiomas_disponiveis() -> dict:
    """Lista os idiomas ativos disponíveis para traduções."""

    async with AsyncSessionLocal() as session:
        result = await session.scalars(
            select(Language)
            .where(Language.is_active.is_(True))
            .order_by(Language.name)
        )

        languages = result.all()

        return {
            "idiomas": [
                {
                    "nome": language.name,
                    "codigo": language.code,
                }
                for language in languages
            ]
        }


async def calcular_estimativa_traducao(
    servico: str,
    idioma_origem: str,
    idioma_destino: str,
    quantidade_palavras: int,
) -> dict:
    """
    Calcula uma estimativa usando exclusivamente preços ativos cadastrados.

    Exige o nome exato do serviço e dos idiomas disponíveis.
    Não cria solicitações nem orçamentos no sistema.
    """

    if quantidade_palavras <= 0:
        return {
            "erro": "A quantidade de palavras deve ser maior que zero."
        }

    source_language = aliased(Language)
    target_language = aliased(Language)

    async with AsyncSessionLocal() as session:
        statement = (
            select(
                Service.name,
                source_language.name,
                target_language.name,
                TranslationPrice.price_per_word,
            )
            .join(
                TranslationPrice,
                TranslationPrice.service_id == Service.id,
            )
            .join(
                source_language,
                TranslationPrice.source_language_id
                == source_language.id,
            )
            .join(
                target_language,
                TranslationPrice.target_language_id
                == target_language.id,
            )
            .where(
                Service.is_active.is_(True),
                source_language.is_active.is_(True),
                target_language.is_active.is_(True),
                TranslationPrice.is_active.is_(True),
                func.lower(func.trim(Service.name))
                == servico.strip().lower(),
                func.lower(func.trim(source_language.name))
                == idioma_origem.strip().lower(),
                func.lower(func.trim(target_language.name))
                == idioma_destino.strip().lower(),
            )
        )

        result = await session.execute(statement)
        prices = result.all()

        if not prices:
            return {
                "erro": (
                    "Não foi encontrado um preço ativo para essa "
                    "combinação de serviço e idiomas."
                )
            }

        if len(prices) > 1:
            return {
                "erro": (
                    "A combinação informada é ambígua. "
                    "Confirme os nomes do serviço e dos idiomas."
                )
            }

        service_name, source_name, target_name, price_per_word = prices[0]

        total = (
            Decimal(price_per_word) * quantidade_palavras
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        return {
            "servico": service_name,
            "idioma_origem": source_name,
            "idioma_destino": target_name,
            "quantidade_palavras": quantidade_palavras,
            "preco_por_palavra": str(price_per_word),
            "valor_estimado": str(total),
            "observacao": (
                "Esta é uma estimativa baseada nos preços ativos "
                "cadastrados. Não representa um orçamento aprovado."
            ),
        }
