import { apiRequest } from './api';

export type TranslationLanguage =
  | 'portuguese'
  | 'english'
  | 'spanish'
  | 'german'
  | 'italian'
  | 'french'
  | 'other';

export type TranslationRequest = {
  id: number;
  username: string;
  email: string;
  phone: string;
  company: string | null;
  translate_from: TranslationLanguage;
  translate_to: TranslationLanguage;
  observations: string | null;
  employee_id: number;
};

export type TranslationRequestInput = Omit<TranslationRequest, 'id'>;
export type TranslationRequestUpdate = Partial<TranslationRequestInput>;

export async function getRequests() {
  return apiRequest<TranslationRequest[]>('/requests/');
}

export function getRequest(id: number) {
  return apiRequest<TranslationRequest>(`/requests/${id}`);
}

export function createRequest(request: TranslationRequestInput) {
  return apiRequest<TranslationRequest>('/requests/', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function updateRequest(
  id: number,
  request: TranslationRequestUpdate,
) {
  return apiRequest<TranslationRequest>(`/requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export function deleteRequest(id: number) {
  return apiRequest<void>(`/requests/${id}`, {
    method: 'DELETE',
  });
}