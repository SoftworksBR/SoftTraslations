import { apiRequest, clearAccessToken, setAccessToken } from './api';
import type { Employee } from './employees';

export type LoginResponse = {
  access_token: string;
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

  await setAccessToken(result.access_token);
  return result;
}

export function getCurrentEmployee() {
  return apiRequest<Employee>('/auth/me');
}

export function logout() {
  return clearAccessToken();
}