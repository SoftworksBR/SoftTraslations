import { apiRequest } from './api';
import type { ProjectStatus, ProjectStage } from './projects';

export type StageInput = {
  project_id: number;
  freelancer_id: number;
  status: ProjectStatus;
};

export type ProjectStageInput = {
  freelancer_id: number;
  status: ProjectStatus;
};

export type StageUpdate = Partial<Pick<ProjectStage, 'freelancer_id' | 'status'>>;

export async function getStages() {
  return apiRequest<ProjectStage[]>('/stages/');
}

export function getStage(id: number) {
  return apiRequest<ProjectStage>(`/stages/${id}`);
}

export function createStage(stage: StageInput) {
  return apiRequest<ProjectStage>('/stages/', {
    method: 'POST',
    body: JSON.stringify(stage),
  });
}

export function createProjectStage(
  projectId: number,
  stage: ProjectStageInput,
) {
  return apiRequest<ProjectStage>(`/projects/${projectId}/stages`, {
    method: 'POST',
    body: JSON.stringify(stage),
  });
}

export function updateStage(id: number, stage: StageUpdate) {
  return apiRequest<ProjectStage>(`/stages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(stage),
  });
}

export function deleteStage(id: number) {
  return apiRequest<void>(`/stages/${id}`, {
    method: 'DELETE',
  });
}