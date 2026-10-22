import { apiRequest } from './api';

export type CompanyContact = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cargo: string | null;
};

export type CompanyDepartment = {
  id: number;
  nome: string;
  contatos: CompanyContact[];
};

export type Company = {
  id: number;
  razao_social: string;
  cnpj: string;
  departamentos: CompanyDepartment[];
};

export type CompanyInput = {
  razao_social: string;
  cnpj: string;
  departamentos: {
    nome: string;
    contatos: {
      nome: string;
      email: string;
      telefone: string;
      cargo?: string | null;
    }[];
  }[];
};

export function getCompanies(filters: {
  razaoSocial?: string;
  cnpj?: string;
} = {}) {
  const params = new URLSearchParams({ limit: '100', offset: '0' });
  if (filters.razaoSocial) params.set('razao_social', filters.razaoSocial);
  if (filters.cnpj) params.set('cnpj', filters.cnpj);
  return apiRequest<Company[]>(`/empresas/?${params.toString()}`);
}

export function createCompany(company: CompanyInput) {
  return apiRequest<Company>('/empresas/', {
    method: 'POST',
    body: JSON.stringify(company),
  });
}
