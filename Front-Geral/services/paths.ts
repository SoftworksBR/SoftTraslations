import { apiRequest } from './api';
import type { ProjectStage } from './projects';

export type Path = {
  id: number;
  name: string;
  stages: ProjectStage[];
};

export type PathInput = {
  name: string;
  stage_ids: number[];
};

export function getPaths() {
  return apiRequest<Path[]>('/paths/');
}

export function createPath(path: PathInput) {
  return apiRequest<Path>('/paths/', {
    method: 'POST',
    body: JSON.stringify(path),
  });
}

export function deletePath(id: number) {
  return apiRequest<void>(`/paths/${id}`, {
    method: 'DELETE',
  });
}