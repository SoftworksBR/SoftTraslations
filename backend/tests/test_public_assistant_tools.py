import asyncio
from decimal import Decimal
from types import SimpleNamespace

from src.services import public_assistant_tools as tools

QUANTIDADE_PALAVRAS_TESTE = 3


class FakeResult:
    def __init__(self, rows):
        self.rows = rows

    def all(self):
        return self.rows


class FakeSession:
    def __init__(self, rows=None):
        self.rows = rows or []
        self.statement = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return None

    async def scalars(self, statement):
        self.statement = statement
        return FakeResult(self.rows)

    async def execute(self, statement):
        self.statement = statement
        return FakeResult(self.rows)


def run(coro):
    return asyncio.run(coro)


def test_listar_servicos_disponiveis(monkeypatch):
    session = FakeSession([
        SimpleNamespace(name="Tradução", description="Tradução de documentos")
    ])
    monkeypatch.setattr(tools, "AsyncSessionLocal", lambda: session)

    result = run(tools.listar_servicos_disponiveis())

    assert result["servicos"] == [
        {
            "nome": "Tradução",
            "descricao": "Tradução de documentos",
        }
    ]
    assert "services.is_active IS true" in str(session.statement)


def test_listar_idiomas_disponiveis(monkeypatch):
    session = FakeSession([
        SimpleNamespace(name="Português", code="pt")
    ])
    monkeypatch.setattr(tools, "AsyncSessionLocal", lambda: session)

    result = run(tools.listar_idiomas_disponiveis())

    assert result["idiomas"] == [
        {"nome": "Português", "codigo": "pt"}
    ]
    assert "languages.is_active IS true" in str(session.statement)


def test_calcular_estimativa_com_arredondamento(monkeypatch):
    session = FakeSession([
        (
            "Tradução",
            "Português",
            "Inglês",
            Decimal("0.1250"),
        )
    ])
    monkeypatch.setattr(tools, "AsyncSessionLocal", lambda: session)

    result = run(
        tools.calcular_estimativa_traducao(
            servico="Tradução",
            idioma_origem="Português",
            idioma_destino="Inglês",
            quantidade_palavras=QUANTIDADE_PALAVRAS_TESTE,
        )
    )

    assert result["preco_por_palavra"] == "0.1250"
    assert result["valor_estimado"] == "0.38"
    assert result["quantidade_palavras"] == QUANTIDADE_PALAVRAS_TESTE


def test_calcular_estimativa_rejeita_quantidade_zero():
    result = run(
        tools.calcular_estimativa_traducao(
            servico="Tradução",
            idioma_origem="Português",
            idioma_destino="Inglês",
            quantidade_palavras=0,
        )
    )

    assert "erro" in result


def test_calcular_estimativa_sem_preco_ativo(monkeypatch):
    session = FakeSession([])
    monkeypatch.setattr(tools, "AsyncSessionLocal", lambda: session)

    result = run(
        tools.calcular_estimativa_traducao(
            servico="Tradução",
            idioma_origem="Português",
            idioma_destino="Inglês",
            quantidade_palavras=1000,
        )
    )

    assert "erro" in result
    assert "preço ativo" in result["erro"]


def test_calcular_estimativa_rejeita_resultado_ambiguo(monkeypatch):
    session = FakeSession([
        ("Tradução", "Português", "Inglês", Decimal("0.10")),
        ("Tradução", "Português", "Inglês", Decimal("0.20")),
    ])
    monkeypatch.setattr(tools, "AsyncSessionLocal", lambda: session)

    result = run(
        tools.calcular_estimativa_traducao(
            servico="Tradução",
            idioma_origem="Português",
            idioma_destino="Inglês",
            quantidade_palavras=100,
        )
    )

    assert "ambígua" in result["erro"]
