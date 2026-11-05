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

export type ProjectStageFile = {
  id: number;
  original_name: string;
  created_at: string;
};

export type ProjectStageDetails = {
  id: number;
  name: string;
  status: 'ready' | 'in_progress' | 'testing' | 'done';
  freelancer_id: number | null;
  freelancer_name: string | null;
  files: ProjectStageFile[];
};

export type ProjectPathDetails = {
  id: number;
  name: string;
  sequence: number;
  stages: ProjectStageDetails[];
};

export type ProjectDetails = {
  id: number;
  name: string;
  status: Project['status'];
  creator_id: number;
  creator_name: string;
  paths: ProjectPathDetails[];
};

export type ProjectInput = {
  name: string;
  quote_id?: number | null;
  path_ids: number[];
};

export function getProjects() {
  return apiRequest<Project[]>('/projects/');
}

export function getProjectDetails(projectId: number) {
  return apiRequest<ProjectDetails>(`/projects/${projectId}/details`);
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
