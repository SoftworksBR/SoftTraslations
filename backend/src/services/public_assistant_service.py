from uuid import uuid4

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from src.agents.assistant_agent import create_public_assistant_agent
from src.settings import Settings

settings = Settings()

APP_NAME = 'softtranslations_public'

session_service = InMemorySessionService()

agent = create_public_assistant_agent()

runner = Runner(
    agent=agent,
    app_name=APP_NAME,
    session_service=session_service,
)


async def send_public_message(
    message: str,
    session_id: str | None = None,
):
    if not settings.GOOGLE_API_KEY:
        raise RuntimeError('GOOGLE_API_KEY não configurada.')

    # Cada conversa pública possui um identificador próprio.
    if session_id is None:
        session_id = str(uuid4())

    # O identificador da conversa também identifica seu usuário
    # dentro do serviço de sessões públicas.
    user_id = session_id

    session = await session_service.get_session(
        app_name=APP_NAME,
        user_id=user_id,
        session_id=session_id,
    )

    if session is None:
        session = await session_service.create_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id,
        )

    content = types.Content(
        role='user',
        parts=[types.Part(text=message)],
    )

    response = ''

    async for event in runner.run_async(
        user_id=user_id,
        session_id=session.id,
        new_message=content,
    ):
        if event.is_final_response() and event.content:
            response = ''.join(
                part.text
                for part in event.content.parts or []
                if part.text
            )

    return {
        'session_id': session.id,
        'response': response,
    }
