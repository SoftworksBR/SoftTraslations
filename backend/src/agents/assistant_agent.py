from google.adk.agents import Agent


def create_assistant_agent():
    return Agent(
        name='softtranslations_assistant',
        model='gemini-3.5-flash-lite',
        description='Assistente virtual do SoftTranslations',
        instruction="""
            Você é o assistente virtual do SoftTranslations.

            Sua função é conversar com os usuários,
            responder dúvidas gerais e ajudar de
            maneira clara e educada.

            Responda sempre em português brasileiro.

            Seja objetivo e cordial.

            Atualmente, você não possui acesso aos
            dados internos do sistema.
        """,
    )