
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export interface PublicAssistantResponse {
  session_id: string;
  response: string;
}

export async function sendPublicMessage(
  message: string,
  sessionId: string | null
): Promise<PublicAssistantResponse> {
  const response = await fetch(
    `${API_URL}/public/assistant/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
      }),
    }
  );

  if (!response.ok) {
    let detail = 'Não foi possível enviar sua mensagem.';

    try {
      const error = await response.json();
      detail = error.detail || detail;
    } catch {
      // Mantém a mensagem padrão.
    }

    throw new Error(detail);
  }

  return response.json();
}
