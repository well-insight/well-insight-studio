import { apiRequest } from './client'

export type DatasetFieldType = 'text' | 'number' | 'datetime'
export interface DatasetField { id: string; datasetId: string; name: string; fieldType: DatasetFieldType; sortOrder: number }
export interface Dataset { id: string; name: string; description: string | null; projectId: string | null; folderId: string | null; fields: DatasetField[]; rowCount: number }
export interface DatasetRow { id: string; datasetId: string; values: Record<string, string | number | null>; sortOrder: number }
export interface DatasetFolder { id: string; name: string; description: string | null; projectId: string | null; parentId: string | null }

export async function listDatasets(projectId?: string) { return (await apiRequest<{ datasets: Dataset[] }>(`/api/datasets${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`)).datasets }
export async function createDataset(body: { name: string; description?: string; folderId?: string; fields: { name: string; fieldType: DatasetFieldType }[] }) { return (await apiRequest<{ dataset: Dataset }>('/api/datasets', { method: 'POST', body: JSON.stringify(body) })).dataset }
export async function listDatasetFolders(projectId?: string) { return (await apiRequest<{ folders: DatasetFolder[] }>(`/api/datasets/folders${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`)).folders }
export async function createDatasetFolder(body: { name: string; description?: string; parentId?: string | null }) { return apiRequest<DatasetFolder>('/api/datasets/folders', { method: 'POST', body: JSON.stringify(body) }) }
export async function updateDatasetFolder(id: string, body: { name?: string; description?: string | null; parentId?: string | null }) { return apiRequest<DatasetFolder>(`/api/datasets/folders/${id}`, { method: 'PUT', body: JSON.stringify(body) }) }
export async function deleteDatasetFolder(id: string) { await apiRequest<void>(`/api/datasets/folders/${id}`, { method: 'DELETE' }) }
export async function deleteDataset(id: string) { await apiRequest<void>(`/api/datasets/${id}`, { method: 'DELETE' }) }
export async function listDatasetRows(id: string, page = 1, pageSize = 50) { return apiRequest<{ rows: DatasetRow[]; total: number; page: number; pageSize: number }>(`/api/datasets/${id}/rows?page=${page}&pageSize=${pageSize}`) }
export async function addDatasetRows(id: string, rows: Record<string, string | number | null>[]) { return apiRequest<{ count: number }>(`/api/datasets/${id}/rows/batch`, { method: 'POST', body: JSON.stringify({ rows }) }) }
