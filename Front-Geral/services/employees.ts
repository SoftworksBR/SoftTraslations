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
};

export function completeFreelancerProfile(profile: FreelancerProfileInput) {
  return apiRequest<Employee>('/employee/me/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}