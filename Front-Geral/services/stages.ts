import { apiRequest } from './api';

export type StageStatus = 'ready' | 'in_progress' | 'testing' | 'done';

export type StageFile = {
  id: number;
  original_name: string;
};

// Etapa de um projeto, criada a partir de uma etapa modelo da trilha.
export type TranslationStage = {
  id: number;
  name: string;
  project_path_id: number;
  path_stage_id: number;
  freelancer_id: number | null;
  status: StageStatus;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
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

export function updateStage(
  id: number,
  data: { freelancer_id?: number | null; status?: StageStatus },
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
