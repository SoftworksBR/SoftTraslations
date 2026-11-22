import { apiRequest } from './api';

export type EmployeeRole = 'admin' | 'projetos' | 'atendimento' | 'freelancer';
export type EmployeeStatus = 'available' | 'busy' | 'pending';

export type Employee = {
  id: number;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  birth_date?: string | null;
  phone?: string | null;
  role: EmployeeRole;
  status: EmployeeStatus;
  account_status?: 'active' | 'disabled';
  profile_completed?: boolean;
  source_language_ids?: number[];
  target_language_ids?: number[];
};

export type LanguageMatch = 'compatible' | 'undeclared' | 'incompatible' | null;

export type AvailableFreelancer = Employee & {
  language_match: LanguageMatch;
};

export type EmployeeInput = {
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  password: string;
};

export type EmployeeSelfUpdateInput = {
  username?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string;
  phone?: string | null;
  status?: EmployeeStatus;
};

type EmployeeList = {
  employees: Employee[];
};

export function getEmployees(role?: EmployeeRole) {
  const params = new URLSearchParams({
    limit: '100',
    offset: '0',
  });
  if (role) {
    params.set('role', role);
  }
  return apiRequest<EmployeeList>(`/employee/?${params.toString()}`);
}

export function createEmployee(employee: EmployeeInput) {
  return apiRequest<Employee>('/employee/', {
    method: 'POST',
    body: JSON.stringify(employee),
  });
}

export function updateEmployee(id: number, employee: EmployeeInput) {
  return apiRequest<Employee>(`/employee/${id}`, {
    method: 'PUT',
    body: JSON.stringify(employee),
  });
}

export function updateMyEmployee(employee: EmployeeSelfUpdateInput) {
  return apiRequest<Employee>('/employee/me', {
    method: 'PATCH',
    body: JSON.stringify(employee),
  });
}

export function deleteEmployee(id: number) {
  return apiRequest<void>(`/employee/${id}`, { method: 'DELETE' });
}

export function preRegisterFreelancer(data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}) {
  return apiRequest<Employee>('/employee/freelancers/pre-register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export type FreelancerProfileInput = {
  birth_date: string; // AAAA-MM-DD
  phone: string;
  specialization?: string | null;
  bio?: string | null;
  hourly_rate?: number | null;
  source_language_ids?: number[];
  target_language_ids?: number[];
};

export function completeFreelancerProfile(profile: FreelancerProfileInput) {
  return apiRequest<Employee>('/employee/me/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export type FreelancerLanguagesInput = {
  source_language_ids?: number[];
  target_language_ids?: number[];
};

export function updateMyLanguages(languages: FreelancerLanguagesInput) {
  return apiRequest<Employee>('/employee/me/languages', {
    method: 'PATCH',
    body: JSON.stringify(languages),
  });
}

export type PaymentInvoiceInput = {
  freelancer_id: number;
  amount: number;
  description: string;
  issued_on?: string;
  project_id?: number | null;
  stage_id?: number | null;
};

export type PaymentInvoice = {
  id: number;
  invoice_number: string;
  freelancer_id: number;
  amount: string;
  description: string;
  issued_on: string;
  emailed_at?: string | null;
};

export function createPaymentInvoice(data: PaymentInvoiceInput) {
  return apiRequest<PaymentInvoice>('/payment-invoices/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}