import Constants from 'expo-constants';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const expoHostUri = Constants.expoConfig?.hostUri;
const expoHost = expoHostUri
  ? new URL(
      expoHostUri.includes('://')
        ? expoHostUri
        : `http://${expoHostUri}`,
    ).hostname
  : undefined;
const expoLanHost =
  expoHost && /^\d{1,3}(?:\.\d{1,3}){3}$/.test(expoHost)
    ? expoHost
    : undefined;
const apiUrl = new URL(
  configuredApiUrl || `http://${expoLanHost ?? 'localhost'}:8000`,
);

if (expoLanHost && ['localhost', '127.0.0.1'].includes(apiUrl.hostname)) {
  apiUrl.hostname = expoLanHost;
}

const API_URL = apiUrl.toString().replace(/\/$/, '');

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
