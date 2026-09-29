import { apiRequest } from './api';

export type EmployeeRole =
  | 'admin'
  | 'projetos'
  | 'atendimento'
  | 'freelancer'
  | 'orcamento';

export type EmployeeStatus = 'available' | 'busy' | 'pending';

export type FreelancerType =
  | 'tradutor'
  | 'revisor'
  | 'formatador'
  | 'interprete';

export type Employee = {
  id: number;
  username: string;
  email: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  freelancer_type: FreelancerType | null;
};

export type EmployeeInput = {
  username: string;
  email: string;
  role: EmployeeRole;
  password: string;
  status?: EmployeeStatus;
};

export type FreelancerPreRegistrationInput = {
  email: string;
  password: string;
};

export type FreelancerProfileInput = {
  name: string;
  freelancer_type: FreelancerType;
};

type EmployeeList = {
  employees: Employee[];
};

export async function getEmployees(limit = 100, offset = 0) {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const result = await apiRequest<EmployeeList>(`/employee/?${query}`);
  return result.employees;
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
  return apiRequest<void>(`/employee/${id}`, {
    method: 'DELETE',
  });
}

export function preRegisterFreelancer(
  freelancer: FreelancerPreRegistrationInput,
) {
  return apiRequest<Employee>('/employee/freelancers/pre-register', {
    method: 'POST',
    body: JSON.stringify(freelancer),
  });
}

export function completeFreelancerProfile(profile: FreelancerProfileInput) {
  return apiRequest<Employee>('/employee/me/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}