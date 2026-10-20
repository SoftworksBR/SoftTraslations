import { apiRequest } from './api';
import { getItem, setItem } from './storage';

export type RequestStatus = 'pending' | 'quoted' | 'rejected';

export type LanguageOption = {
  id: number;
  name: string;
  code: string | null;
};

export type ServiceOption = {
  id: number;
  name: string;
  description: string | null;
};

export type RequestOptions = {
  languages: LanguageOption[];
  services: ServiceOption[];
};

export type RequestPayload = {
  username: string;
  email: string;
  phone: string;
  company?: string | null;
  source_language_id: number;
  target_language_id: number;
  service_id: number;
  observations?: string | null;
  word_count?: number | null;
};

export type ApiRequest = {
  id: number;
  username: string;
  email: string;
  phone: string;
  company: string | null;
  source_language_id: number;
  target_language_id: number;
  source_language_name: string;
  target_language_name: string;
  service_id: number | null;
  service_name: string | null;
  observations: string | null;
  word_count: number | null;
  employee_id: number | null;
  status: RequestStatus;
  created_at: string;
};

export type RequestFile = {
  id: number;
  original_name: string;
};

export type PublicQuote = {
  value: number;
  deadline: string;
  observations: string | null;
  status: 'in_review' | 'approved' | 'rejected';
};

export type PublicRequest = ApiRequest & {
  public_token: string;
  files: RequestFile[];
  quote: PublicQuote | null;
};

export type RequestFilters = Partial<{
  username: string;
  email: string;
  status: RequestStatus;
  service_id: number;
}>;

// ---- cliente (sem login: identificado pelo token da solicitação) ------

const TOKENS_KEY = 'softtranslations.myRequestTokens';

export function getSavedTokens(): string[] {
  try {
    const raw = getItem(TOKENS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveToken(token: string) {
  const tokens = getSavedTokens().filter((item) => item !== token);
  setItem(TOKENS_KEY, JSON.stringify([token, ...tokens]));
}

export function forgetToken(token: string) {
  setItem(
    TOKENS_KEY,
    JSON.stringify(getSavedTokens().filter((item) => item !== token)),
  );
}

export function getRequestOptions() {
  return apiRequest<RequestOptions>('/requests/options');
}

export async function createRequest(payload: RequestPayload) {
  const created = await apiRequest<ApiRequest & { public_token: string }>(
    '/requests/',
    { method: 'POST', body: JSON.stringify(payload) },
  );
  saveToken(created.public_token);
  return created;
}

export function getPublicRequest(token: string) {
  return apiRequest<PublicRequest>(`/requests/public/${token}`);
}

export function updatePublicRequest(
  token: string,
  payload: Partial<RequestPayload>,
) {
  return apiRequest<PublicRequest>(`/requests/public/${token}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deletePublicRequest(token: string) {
  await apiRequest<void>(`/requests/public/${token}`, { method: 'DELETE' });
  forgetToken(token);
}

export function uploadRequestFile(token: string, file: Blob, name: string) {
  const form = new FormData();
  form.append('file', file, name);
  return apiRequest<RequestFile>(`/requests/public/${token}/files`, {
    method: 'POST',
    body: form,
  });
}

/** Carrega as solicitações salvas neste dispositivo, descartando as que
 *  não existem mais (404). */
export async function loadMyRequests(): Promise<PublicRequest[]> {
  const tokens = getSavedTokens();
  const results = await Promise.all(
    tokens.map(async (token) => {
      try {
        return await getPublicRequest(token);
      } catch (error) {
        if (error instanceof Error && 'status' in error) {
          if ((error as { status: number }).status === 404) {
            forgetToken(token);
          }
        }
        return null;
      }
    }),
  );
  return results.filter((item): item is PublicRequest => item !== null);
}

// ---- atendimento / gestor (autenticados) ------------------------------

export function listRequests(filters: RequestFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return apiRequest<ApiRequest[]>(`/requests/${query ? `?${query}` : ''}`);
}

export function listRequestFiles(requestId: number) {
  return apiRequest<RequestFile[]>(`/requests/${requestId}/files`);
}

export function deleteRequest(requestId: number) {
  return apiRequest<void>(`/requests/${requestId}`, { method: 'DELETE' });
}
