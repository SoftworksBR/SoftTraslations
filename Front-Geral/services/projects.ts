import { apiRequest } from './api';
import { getPaths } from './paths';
import type { TranslationPath } from './paths';

export type Path = TranslationPath;

export type Project = {
  id: number;
  name: string;
  status: 'ready' | 'in_progress' | 'testing' | 'done';
  creator_id: number;
  quote_id: number | null;
  paths: TranslationPath[];
};

export type ProjectInput = {
  name: string;
  quote_id?: number | null;
  path_ids: number[];
};

export function getProjects() {
  return apiRequest<Project[]>('/projects/');
}

export function listPaths() {
  return getPaths();
}

export function createProject(project: ProjectInput) {
  return apiRequest<Project>('/projects/', {
    method: 'POST',
    body: JSON.stringify(project),
  });
}
