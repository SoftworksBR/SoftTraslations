import { apiRequest } from './api';
import type { AvailableFreelancer } from './employees';

export type StageStatus =
  | 'no_freelancer'
  | 'public'
  | 'ready'
  | 'in_progress'
  | 'testing'
  | 'done';

// Situação do segundo candidato da oferta ('accepted' só em etapas antigas).
export type CollaborationStatus = 'invited' | 'accepted';

export type StageFile = {
  id: number;
  original_name: string;
  uploaded_by_id: number | null;
};

// Etapa de um projeto, criada a partir de uma etapa modelo da trilha.
export type TranslationStage = {
  id: number;
  name: string;
  project_path_id: number;
  path_stage_id: number;
  freelancer_id: number | null;
  freelancer_name: string | null;
  status: StageStatus;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  rejection_comment: string | null;
  second_freelancer_id: number | null;
  second_freelancer_name: string | null;
  second_status: CollaborationStatus | null;
  files: StageFile[];
};

// Etapa reutilizável usada para montar trilhas.
export type StageTemplate = {
  id: number;
  name: string;
  description: string | null;
};

export function getStages() {
  return apiRequest<TranslationStage[]>('/stages/');
}

export function getAvailableStageFreelancers(
  stageId: number,
  { includeAll = false }: { includeAll?: boolean } = {},
) {
  const query = includeAll ? '?include_all=true' : '';
  return apiRequest<AvailableFreelancer[]>(
    `/stages/${stageId}/available-freelancers${query}`,
  );
}

export function acceptStage(id: number) {
  return apiRequest<TranslationStage>(`/stages/${id}/accept`, {
    method: 'POST',
  });
}

export function declineStage(id: number) {
  return apiRequest<TranslationStage>(`/stages/${id}/decline`, {
    method: 'POST',
  });
}

export function inviteCollaborator(stageId: number, freelancerId: number) {
  return apiRequest<TranslationStage>(`/stages/${stageId}/collaborator`, {
    method: 'POST',
    body: JSON.stringify({ freelancer_id: freelancerId }),
  });
}

export function removeCollaborator(stageId: number) {
  return apiRequest<TranslationStage>(`/stages/${stageId}/collaborator`, {
    method: 'DELETE',
  });
}

export function updateStage(
  id: number,
  data: {
    freelancer_id?: number | null;
    status?: StageStatus;
    rejection_comment?: string | null;
  },
) {
  return apiRequest<TranslationStage>(`/stages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function uploadStageFile(stageId: number, file: File) {
  const body = new FormData();
  body.append('upload', file);
  return apiRequest<StageFile>(`/stages/${stageId}/files`, {
    method: 'POST',
    body,
  });
}

export function deleteStageFile(stageId: number, fileId: number) {
  return apiRequest<void>(`/stages/${stageId}/files/${fileId}`, {
    method: 'DELETE',
  });
}

export function deleteStage(id: number) {
  return apiRequest<void>(`/stages/${id}`, { method: 'DELETE' });
}

export function getStageTemplates() {
  return apiRequest<StageTemplate[]>('/stage-templates/');
}

export function createStageTemplate(name: string, description?: string) {
  return apiRequest<StageTemplate>('/stage-templates/', {
    method: 'POST',
    body: JSON.stringify({ name, description: description || null }),
  });
}
