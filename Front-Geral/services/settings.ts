import { apiRequest } from './api';

export type Language = {
  id: number;
  name: string;
  code: string | null;
  is_active: boolean;
};

export type Service = {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export type TranslationPrice = {
  id: number;
  service_id: number;
  source_language_id: number;
  target_language_id: number;
  price_per_word: number | string;
  is_active: boolean;
};

export type LanguagePayload = {
  name: string;
  code: string | null;
  is_active?: boolean;
};

export type ServicePayload = {
  name: string;
  description: string | null;
  is_active?: boolean;
};

export type TranslationPricePayload = {
  service_id: number;
  source_language_id: number;
  target_language_id: number;
  price_per_word: string;
  is_active?: boolean;
};

export function listLanguages() {
  return apiRequest<Language[]>('/idiomas?include_inactive=true');
}

export function createLanguage(payload: LanguagePayload) {
  return apiRequest<Language>('/idiomas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateLanguage(id: number, payload: Partial<LanguagePayload>) {
  return apiRequest<Language>(`/idiomas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function listServices() {
  return apiRequest<Service[]>('/servicos?include_inactive=true');
}

export function createService(payload: ServicePayload) {
  return apiRequest<Service>('/servicos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateService(id: number, payload: Partial<ServicePayload>) {
  return apiRequest<Service>(`/servicos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function listTranslationPrices() {
  return apiRequest<TranslationPrice[]>('/precos-traducao?include_inactive=true');
}

export function createTranslationPrice(payload: TranslationPricePayload) {
  return apiRequest<TranslationPrice>('/precos-traducao', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTranslationPrice(
  id: number,
  payload: Partial<TranslationPricePayload>,
) {
  return apiRequest<TranslationPrice>(`/precos-traducao/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
