import { apiRequest } from './api';
import type { ProjectStage } from './projects';

export type PathStageInput = Pick<ProjectStage, 'freelancer_id' | 'status'>;

export type Path = {
  id: number;
  name: string;
  stages: ProjectStage[];
};

export type PathInput = {
  name: string;
  stages: PathStageInput[];
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