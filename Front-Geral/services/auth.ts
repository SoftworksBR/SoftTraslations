import { apiRequest, clearLegacyAccessToken } from './api';
import type { Employee } from './employees';

export type LoginResponse = {
  token_type: string;
};

export async function login(email: string, password: string) {
  const form = new URLSearchParams({
    username: email,
    password,
  });
  const result = await apiRequest<LoginResponse>('/auth/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });

  await clearLegacyAccessToken();
  return result;
}

export function getCurrentEmployee() {
  return apiRequest<Employee>('/auth/me');
}

export async function logout() {
  await apiRequest<void>('/auth/logout', { method: 'POST' });
  await clearLegacyAccessToken();
}