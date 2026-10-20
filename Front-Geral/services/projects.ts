import { apiRequest } from './api';

export type ProjectStatus = 'ready' | 'in_progress' | 'testing' | 'done';

export type Path = {
  id: number;
  name: string;
};

export type Project = {
  id: number;
  name: string;
  status: ProjectStatus;
  creator_id: number;
  quote_id: number | null;
  paths: Path[];
};

export type ProjectPayload = {
  name: string;
  quote_id: number;
  path_ids: number[];
  status?: ProjectStatus;
};

export const projectStatusLabel: Record<ProjectStatus, string> = {
  ready: 'pronto para iniciar',
  in_progress: 'em andamento',
  testing: 'em revisão',
  done: 'concluído',
};

export function listProjects() {
  return apiRequest<Project[]>('/projects/');
}

export function createProject(payload: ProjectPayload) {
  return apiRequest<Project>('/projects/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listPaths() {
  return apiRequest<Path[]>('/paths/');
}
