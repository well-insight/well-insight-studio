import type { DatasourceSchema, QueryRequest, QueryResponse } from '@well-insight/shared'
import { apiRequest } from './client'

export interface ProjectDatasource {
  id: string
  projectId: string
  name: string
  type: 'mysql' | 'postgres' | 'csv'
  connectionString: string | null
  hasConnection: boolean
  schemaCache: DatasourceSchema['tables']
  updatedAt: string
  createdAt: string
}

export interface CreateDatasourceRequest {
  projectId: string
  name: string
  type?: 'mysql' | 'postgres' | 'csv'
  connectionString?: string
}

export interface UpdateDatasourceRequest {
  name?: string
  connectionString?: string
}

export async function fetchDatasourceSchema(datasourceId: string): Promise<DatasourceSchema> {
  return apiRequest<DatasourceSchema>(`/api/datasources/${datasourceId}/schema`)
}

export async function queryDatasource(datasourceId: string, request: QueryRequest): Promise<QueryResponse> {
  return apiRequest<QueryResponse>(`/api/datasources/${datasourceId}/query`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function createDatasource(request: CreateDatasourceRequest): Promise<ProjectDatasource> {
  return apiRequest<ProjectDatasource>('/api/datasources', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function updateDatasource(id: string, request: UpdateDatasourceRequest): Promise<ProjectDatasource> {
  return apiRequest<ProjectDatasource>(`/api/datasources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
}

export async function deleteDatasource(id: string): Promise<void> {
  return apiRequest<void>(`/api/datasources/${id}`, { method: 'DELETE' })
}

export async function testDatasource(id: string): Promise<{ ok: boolean; message?: string }> {
  return apiRequest<{ ok: boolean; message?: string }>(`/api/datasources/${id}/test`, { method: 'POST' })
}

/** 将后端 schema 结构转换为前端 TableData 格式，便于现有 UI 消费 */
export function schemaToTables(schema: DatasourceSchema): Record<string, { fields: string[]; rows: unknown[][] }> {
  return Object.fromEntries(
    Object.entries(schema.tables).map(([name, table]) => [
      name,
      {
        fields: table.fields.map(f => f.name),
        rows: [],
      },
    ]),
  )
}
