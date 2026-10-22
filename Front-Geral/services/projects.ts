import { apiRequest } from './api';
import type { TranslationPath } from './paths';

export type Project = {
  id: number;
  name: string;
  status: 'ready' | 'in_progress' | 'testing' | 'done';
  creator_id: number;
  paths: TranslationPath[];
};

export function getProjects() {
  return apiRequest<Project[]>('/projects/');
}
