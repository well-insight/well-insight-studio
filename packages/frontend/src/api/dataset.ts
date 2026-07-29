import { request } from '@/utils'
import { axiosInstance } from '@/utils/request/alovaConfig'

export type DatasetFieldType = 'text' | 'number' | 'datetime'

export interface ApiFolderTreeNode {
  id: string
  parent_id: string | null
  project_id: string | null
  name: string
  description: string | null
  owner_id: string
  sort_order: number
  created_at: string
  updated_at: string
  children: ApiFolderTreeNode[]
}

export interface ApiDatasetListItem {
  id: string
  name: string
  description: string | null
  owner_id: string
  project_id: string | null
  folder_id: string | null
  created_at: string
  updated_at: string
  field_count: number
  row_count: number
  form_schema?: Record<string, unknown> | null
  fields?: ApiDatasetField[]
}

export interface ApiDatasetField {
  id: string
  dataset_id: string
  name: string
  field_type: DatasetFieldType
  sort_order: number
  created_at: string
}

export interface ApiDatasetDetail extends Omit<ApiDatasetListItem, 'field_count'> {
  form_schema?: Record<string, unknown> | null
  fields: ApiDatasetField[]
  row_count: number
}

export interface ApiDatasetRow {
  id: string
  dataset_id: string
  sort_order: number
  values: Record<string, unknown>
  created_at: string
}

function listQueryParams(projectId?: string | null, folderId?: string | null) {
  const params: Record<string, string> = {}
  if (projectId !== undefined) {
    params.projectId = projectId === null ? 'null' : projectId
  }
  if (folderId !== undefined) {
    params.folderId = folderId === null ? 'null' : folderId
  }
  return params
}

/** Alova 默认会缓存 GET 5 分钟，目录/列表需实时刷新时关闭缓存 */
const noGetCache = { cacheFor: 0 as const }

export function fetchDatasetFolderTree(projectId?: string | null) {
  return request.get<ApiFolderTreeNode[]>('/datasets/folders/tree', listQueryParams(projectId), noGetCache)
}

/** 当前用户全部数据集（不按目录过滤），用于与目录树合并 */
export function fetchAllDatasets(projectId?: string | null) {
  return request.get<ApiDatasetListItem[]>('/datasets', listQueryParams(projectId), noGetCache)
}

export function fetchDatasetFolderDetail(folderId: string) {
  return request.get<
    ApiFolderTreeNode & { child_folder_count: number, dataset_count: number }
  >(`/datasets/folders/${folderId}`, {}, noGetCache)
}

export function fetchDatasetDetail(datasetId: string) {
  return request.get<ApiDatasetDetail>(`/datasets/${datasetId}`, {}, noGetCache)
}

export interface DatasetRowsPage {
  rows: ApiDatasetRow[]
  total: number
  page: number
  pageSize: number
}

export async function fetchDatasetRowsPage(
  datasetId: string,
  page = 1,
  pageSize = 20,
): Promise<DatasetRowsPage> {
  const res = (await axiosInstance.get(`/datasets/${datasetId}/rows`, {
    params: { page, pageSize },
  })) as {
    success: boolean
    data: ApiDatasetRow[]
    total: number
    page: number
    pageSize: number
  }
  return {
    rows: res.data,
    total: res.total,
    page: res.page,
    pageSize: res.pageSize,
  }
}

export function createDatasetRow(
  datasetId: string,
  body: { values: Record<string, string | number | null>, sort_order?: number },
) {
  return request.post<ApiDatasetRow>(`/datasets/${datasetId}/rows`, body)
}

export function createDatasetRows(
  datasetId: string,
  rows: Record<string, string | number | null>[],
) {
  return request.post<{ count: number }>(`/datasets/${datasetId}/rows/batch`, { rows })
}

export function updateDatasetRow(
  datasetId: string,
  rowId: string,
  body: { values: Record<string, string | number | null>, sort_order?: number },
) {
  return request.put<ApiDatasetRow>(`/datasets/${datasetId}/rows/${rowId}`, body)
}

export function deleteDatasetRow(datasetId: string, rowId: string) {
  return request.delete<undefined>(`/datasets/${datasetId}/rows/${rowId}`)
}

export function createDatasetFolder(body: {
  name: string
  description?: string | null
  parent_id?: string | null
  project_id?: string | null
  sort_order?: number
}) {
  return request.post<ApiFolderTreeNode>('/datasets/folders', body)
}

export function updateDatasetFolder(
  folderId: string,
  body: {
    name?: string
    description?: string | null
    parent_id?: string | null
    project_id?: string | null
    sort_order?: number
  },
) {
  return request.put<ApiFolderTreeNode>(`/datasets/folders/${folderId}`, body)
}

export function deleteDatasetFolder(folderId: string) {
  return request.delete<undefined>(`/datasets/folders/${folderId}`)
}

export function createDataset(body: {
  name: string
  description?: string | null
  project_id?: string | null
  folder_id?: string | null
  form_schema?: Record<string, unknown> | null
  fields: { name: string, field_type: DatasetFieldType, sort_order?: number }[]
}) {
  return request.post<ApiDatasetDetail>('/datasets', body)
}

export function updateDataset(
  id: string,
  body: {
    name?: string
    description?: string | null
    project_id?: string | null
    folder_id?: string | null
    form_schema?: Record<string, unknown> | null
    fields?: { name: string, field_type: DatasetFieldType, sort_order?: number }[]
  },
) {
  return request.put<ApiDatasetDetail>(`/datasets/${id}`, body)
}

export function deleteDataset(id: string) {
  return request.delete<undefined>(`/datasets/${id}`)
}
