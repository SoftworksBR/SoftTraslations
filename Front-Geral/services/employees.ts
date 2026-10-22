import { apiRequest } from './api';

export type EmployeeRole = 'admin' | 'projetos' | 'atendimento' | 'freelancer';
export type EmployeeStatus = 'available' | 'busy' | 'pending';

export type Employee = {
  id: number;
  username: string;
  email: string;
  role: EmployeeRole;
  status: EmployeeStatus;
};

export type EmployeeInput = {
  username: string;
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

export function preRegisterFreelancer(email: string, password: string) {
  return apiRequest<Employee>('/employee/freelancers/pre-register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function completeFreelancerProfile(name: string) {
  return apiRequest<Employee>('/employee/me/profile', {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}