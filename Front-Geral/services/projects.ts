import { apiRequest } from './api';

export type ProjectStatus = 'ready' | 'in_progress' | 'testing' | 'done';

export type ProjectStage = {
  id: number;
  path_id: number;
  freelancer_id: number;
  status: ProjectStatus;
};

export type ProjectPath = {
  id: number;
  name: string;
  stages: ProjectStage[];
};

export type Project = {
  id: number;
  name: string;
  status: ProjectStatus;
  creator_id: number;
  paths: ProjectPath[];
};

export type ProjectInput = {
  name: string;
  status: ProjectStatus;
  creator_id: number;
  path_ids: number[];
};

export async function getProjects() {
  return apiRequest<Project[]>('/projects/');
}

export function getProject(id: number) {
  return apiRequest<Project>(`/projects/${id}`);
}

export function createProject(project: ProjectInput) {
  return apiRequest<Project>('/projects/', {
    method: 'POST',
    body: JSON.stringify(project),
  });
}

export function updateProject(id: number, project: Partial<ProjectInput>) {
  return apiRequest<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(project),
  });
}

export function deleteProject(id: number) {
  return apiRequest<void>(`/projects/${id}`, {
    method: 'DELETE',
  });
}