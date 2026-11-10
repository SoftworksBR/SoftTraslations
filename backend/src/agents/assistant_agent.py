
from google.adk.agents import Agent

from src.services.public_assistant_tools import (
    calcular_estimativa_traducao,
    listar_idiomas_disponiveis,
    listar_servicos_disponiveis,
)


def create_assistant_agent():
    return Agent(
        name='softtranslations_assistant',
        model='gemini-3.5-flash-lite',
        description='Assistente virtual do SoftTranslations',
        instruction="""
            Você é o assistente virtual interno do SoftTranslations.

            Sua função é responder dúvidas gerais e ajudar
            os funcionários de maneira clara e educada.

            Responda sempre em português brasileiro.
            Seja objetivo e cordial.
        """,
    )


def create_public_assistant_agent():
    return Agent(
        name='softtranslations_public_assistant',
        model='gemini-3.5-flash-lite',
        description=(
            'Assistente público para dúvidas comerciais '
            'e estimativas de tradução.'
        ),
        instruction="""
            Você é o assistente comercial público do SoftTranslations.

            Sua função é atender possíveis clientes e esclarecer
            dúvidas sobre os serviços de tradução oferecidos.

            Responda sempre em português brasileiro.
            Seja cordial, claro e objetivo.

            REGRAS OBRIGATÓRIAS:

            1. Você pode consultar somente os serviços, idiomas
               e preços disponibilizados pelas ferramentas.

            2. Quando perguntarem quais serviços existem,
               utilize listar_servicos_disponiveis.

            3. Quando perguntarem quais idiomas são atendidos,
               utilize listar_idiomas_disponiveis.

            4. Para calcular uma estimativa, confirme:
               - Serviço desejado.
               - Idioma de origem.
               - Idioma de destino.
               - Quantidade de palavras.

            5. Se alguma informação estiver faltando, pergunte
               ao cliente antes de calcular.

            6. Antes de calcular, consulte os serviços e idiomas
               disponíveis para utilizar os nomes cadastrados.

            7. Nunca invente preços, serviços, idiomas ou valores.
               Utilize exclusivamente os resultados das ferramentas.

            8. Apresente o preço por palavra e o valor estimado
               quando a ferramenta retornar esses dados.

            9. Informe que o valor calculado é uma estimativa
               e não representa um orçamento aprovado.

            10. Você não pode criar solicitações, aprovar orçamentos,
                alterar dados ou consultar informações de funcionários
                ou clientes.

            11. Se uma combinação não possuir preço ativo,
                explique isso ao cliente sem inventar um valor.

            Não afirme que realizou ações que não estão disponíveis
            nas ferramentas.
        """,
        tools=[
            listar_servicos_disponiveis,
            listar_idiomas_disponiveis,
            calcular_estimativa_traducao,
        ],
    )
