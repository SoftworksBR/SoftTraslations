import { apiRequest } from './api';

export type TranslationStage = {
  id: number;
  name: string;
  freelancer_id: number;
  status: 'ready' | 'in_progress' | 'testing' | 'done';
};

export function getStages() {
  return apiRequest<TranslationStage[]>('/stages/');
}

export function createStage(name: string, freelancerId: number) {
  return apiRequest<TranslationStage>('/stages/', {
    method: 'POST',
    body: JSON.stringify({
      name,
      freelancer_id: freelancerId,
      status: 'ready',
    }),
  });
}

export function deleteStage(id: number) {
  return apiRequest<void>(`/stages/${id}`, { method: 'DELETE' });
}
