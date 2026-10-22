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
  employee_id: number | null;
};

export type TranslationRequestInput = Omit<
  TranslationRequest,
  'id' | 'employee_id'
>;

export function getRequests() {
  return apiRequest<TranslationRequest[]>('/requests/');
}

export function createRequest(request: TranslationRequestInput) {
  const employeeId = Number(
    process.env.EXPO_PUBLIC_DEFAULT_REQUEST_EMPLOYEE_ID,
  );
  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    throw new Error(
      'Configure EXPO_PUBLIC_DEFAULT_REQUEST_EMPLOYEE_ID com um ID válido.',
    );
  }

  return apiRequest<TranslationRequest>('/requests/', {
    method: 'POST',
    body: JSON.stringify({ ...request, employee_id: employeeId }),
  });
}

export function deleteRequest(id: number) {
  return apiRequest<void>(`/requests/${id}`, { method: 'DELETE' });
}