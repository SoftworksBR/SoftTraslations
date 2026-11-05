import { apiRequest } from './api';

export type CompanyContact = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  general_info: string | null;
};

export type Company = {
  id: number;
  name: string;
  primary_email: string | null;
  website: string | null;
  primary_phone: string | null;
  general_info: string | null;
  is_legal_entity: boolean;
  tax_id: string | null;
  employees: CompanyContact[];
};

export type CompanyInput = {
  name: string;
  primary_email: string;
  primary_phone: string;
  tax_id?: string | null;
  website?: string | null;
  general_info?: string | null;
  is_legal_entity?: boolean;
  employees?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    general_info?: string | null;
  }[];
};

export function getCompanies() {
  return apiRequest<Company[]>('/companies/');
}

export function createCompany(company: CompanyInput) {
  return apiRequest<Company>('/companies/', {
    method: 'POST',
    body: JSON.stringify(company),
  });
}