import { apiRequest } from './api';

export type LanguageOption = { id: number; name: string; code: string | null };
export type ServiceOption = {
  id: number;
  name: string;
  description: string | null;
};
export type RequestOptions = {
  languages: LanguageOption[];
  services: ServiceOption[];
};

export type TranslationRequest = {
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
  status: string;
  created_at: string;
};

export type TranslationRequestInput = {
  username: string;
  email: string;
  phone: string;
  company?: string | null;
  source_language_id: number;
  target_language_id: number;
  service_id?: number | null;
  observations?: string | null;
  word_count?: number | null;
};

export type RequestFile = { id: number; original_name: string };

export function getRequestOptions() {
  return apiRequest<RequestOptions>('/requests/options');
}

export function getRequests() {
  return apiRequest<TranslationRequest[]>('/requests/');
}

export function createRequest(request: TranslationRequestInput) {
  return apiRequest<TranslationRequest & { public_token: string }>(
    '/requests/',
    { method: 'POST', body: JSON.stringify(request) },
  );
}

export function uploadRequestFile(token: string, file: File) {
  const body = new FormData();
  body.append('file', file);
  return apiRequest<RequestFile>(`/requests/public/${token}/files`, {
    method: 'POST',
    body,
  });
}

export function getRequestFiles(requestId: number) {
  return apiRequest<RequestFile[]>(`/requests/${requestId}/files`);
}

export function deleteRequest(id: number) {
  return apiRequest<void>(`/requests/${id}`, { method: 'DELETE' });
}