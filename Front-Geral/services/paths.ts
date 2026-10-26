import { apiRequest } from './api';
import type { StageTemplate } from './stages';

export type TranslationPath = {
  id: number;
  name: string;
  stages: StageTemplate[];
};

export function getPaths() {
  return apiRequest<TranslationPath[]>('/paths/');
}

export function createPath(name: string, stageIds: number[]) {
  return apiRequest<TranslationPath>('/paths/', {
    method: 'POST',
    body: JSON.stringify({ name, stage_ids: stageIds }),
  });
}
