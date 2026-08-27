import type { ProjectConfig } from '@well-insight/shared'
import { apiRequest } from './client'

export interface ProjectSummary {
  id: string
  name: string
  updatedAt: string
}

export interface ProjectDetail extends ProjectSummary {
  config: ProjectConfig
}

export interface DatasourceSummary {
  id: string
  projectId: string
  name: string
  type: 'mysql' | 'postgres' | 'csv'
  connectionString: string | null
  hasConnection: boolean
  schemaCache: Record<string, { fields: { name: string; type: 'number' | 'string' }[] }>
  createdAt: string
  updatedAt: string
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const { projects } = await apiRequest<{ projects: ProjectSummary[] }>('/api/projects')
  return projects
}

export async function createProject(name: string, config?: ProjectConfig): Promise<ProjectDetail> {
  return apiRequest<ProjectDetail>('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name, config }),
  })
}

export async function getProject(id: string): Promise<ProjectDetail> {
  return apiRequest<ProjectDetail>(`/api/projects/${id}`)
}

export async function updateProject(id: string, patch: { name?: string; config?: ProjectConfig }): Promise<ProjectDetail> {
  return apiRequest<ProjectDetail>(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
}

export async function deleteProject(id: string): Promise<void> {
  await apiRequest<void>(`/api/projects/${id}`, { method: 'DELETE' })
}

export async function getProjectDatasources(id: string): Promise<DatasourceSummary[]> {
  const { datasources } = await apiRequest<{ datasources: DatasourceSummary[] }>(`/api/projects/${id}/datasources`)
  return datasources
}
