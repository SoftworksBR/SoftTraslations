import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'
).replace(/\/$/, '');

const ACCESS_TOKEN_KEY = 'softtranslations.accessToken';

export async function clearLegacyAccessToken() {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function formatErrorDetail(detail: unknown): string | undefined {
  if (typeof detail === 'string') {
    return detail;
  }

  if (!Array.isArray(detail)) {
    return undefined;
  }

  const messages = detail.map((issue: unknown) => {
    if (typeof issue !== 'object' || issue === null) {
      return String(issue);
    }

    const validationIssue = issue as { loc?: unknown; msg?: unknown };
    const location = Array.isArray(validationIssue.loc)
      ? validationIssue.loc.slice(1).join('.')
      : '';
    const message =
      typeof validationIssue.msg === 'string'
        ? validationIssue.msg
        : 'Erro de validação';

    return location ? `${location}: ${message}` : message;
  });

  return messages.length > 0 ? messages.join('; ') : undefined;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();
  let responseBody: unknown;

  try {
    responseBody = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    responseBody = responseText;
  }

  if (!response.ok) {
    const detail =
      typeof responseBody === 'object' &&
      responseBody !== null &&
      'detail' in responseBody
        ? responseBody.detail
        : undefined;
    const message =
      formatErrorDetail(detail) ??
      (typeof responseBody === 'string' && responseBody
        ? responseBody
        : `Falha na API (${response.status})`);

    throw new ApiError(message, response.status);
  }

  return responseBody as T;
}
