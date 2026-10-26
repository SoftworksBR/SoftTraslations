import { apiRequest } from './api';

export type QuoteStatus = 'in_review' | 'approved' | 'rejected';

export type Quote = {
  id: number;
  request_id: number;
  value: number;
  deadline: string; // AAAA-MM-DD
  observations: string | null;
  status: QuoteStatus;
  created_by_id: number;
  approved_by_id: number | null;
  approved_at: string | null;
  created_at: string;
  client_name: string;
  client_email: string;
  service_name: string | null;
  source_language_name: string;
  target_language_name: string;
};

export type QuotePayload = {
  request_id: number;
  value: string; // enviado como texto para não perder centavos
  deadline: string;
  observations?: string | null;
};

export type QuoteSuggestion = {
  request_id: number;
  word_count: number | null;
  price_per_word: number | null;
  suggested_value: number | null;
};

export const quoteStatusLabel: Record<QuoteStatus, string> = {
  in_review: 'em análise',
  approved: 'aprovado',
  rejected: 'recusado',
};

export function listQuotes(
  filters: Partial<{
    status: QuoteStatus;
    request_id: number;
    client_name: string;
    available_for_project: boolean;
  }> = {},
) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return apiRequest<Quote[]>(`/quotes/${query ? `?${query}` : ''}`);
}

export function createQuote(payload: QuotePayload) {
  return apiRequest<Quote>('/quotes/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getQuoteSuggestion(requestId: number, wordCount?: number) {
  const params = new URLSearchParams({ request_id: String(requestId) });
  if (wordCount) {
    params.set('word_count', String(wordCount));
  }
  return apiRequest<QuoteSuggestion>(`/quotes/suggestion?${params}`);
}

export function approveQuote(quoteId: number) {
  return apiRequest<Quote>(`/quotes/${quoteId}/approve`, { method: 'PUT' });
}

export function rejectQuote(quoteId: number) {
  return apiRequest<Quote>(`/quotes/${quoteId}/reject`, { method: 'PUT' });
}

/** 850 -> "R$ 850,00" */
export function formatMoney(value: number) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

/** "2026-12-01" -> "01/12/2026" */
export function formatDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

/** "01/12/2026" -> "2026-12-01" (ou null se inválida) */
export function parseDateBr(text: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) {
    return null;
  }
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getDate() !== Number(day) ||
    date.getMonth() + 1 !== Number(month)
  ) {
    return null;
  }
  return `${year}-${month}-${day}`;
}

/** "1.250,50" ou "1250.50" -> "1250.50" (ou null se inválido/<=0) */
export function parseMoney(text: string) {
  const cleaned = text.replace(/[^\d.,]/g, '');
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const number = Number(normalized);
  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }
  return number.toFixed(2);
}
