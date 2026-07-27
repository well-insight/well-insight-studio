import { request } from '@/utils'

const noGetCache = { cacheFor: 0 as const }

export type PageType = 'visualization' | 'form' | 'report'
export type PageStatus = 'draft' | 'published'
export type PageDatasetBindingMode = 'create' | 'edit' | 'detail' | 'list'

export interface PageDatasetFieldMapItem {
  formFieldId: string
  datasetFieldId: string
}

export interface PageDatasetBinding {
  datasetId: string
  mode: PageDatasetBindingMode
  fieldMap: PageDatasetFieldMapItem[]
}

export type PageDatasetBindings = PageDatasetBinding[]

export interface ApiPageDetail {
  id: string
  folder_id?: string | null
  name: string
  type: PageType
  dsl: Record<string, unknown>
  dataset_bindings?: PageDatasetBindings | null
  preview_url?: string | null
  status: PageStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface ApiPageListItem {
  id: string
  folder_id?: string | null
  name: string
  type: PageType
  status: PageStatus
  created_at: string
  updated_at: string
}

export interface ApiFormRecord {
  id: string
  page_id: string
  values: Record<string, unknown>
  sort_order: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface ApiPageRecordsPage {
  items: ApiFormRecord[]
  total: number
  page: number
  pageSize: number
}

export interface ApiPageFolder {
  id: string
  parent_id: string | null
  name: string
  description: string | null
  owner_id: string
  sort_order: number
  created_at: string
  updated_at: string
  children?: ApiPageFolder[]
}

export function fetchPageList(params?: {
  type?: PageType
  status?: PageStatus
  folder_id?: string | null
  keyword?: string
  page?: number
  pageSize?: number
}) {
  return request.get<{ items: ApiPageListItem[], total: number }>('/pages', params, noGetCache)
}

export function fetchPage(id: string) {
  return request.get<ApiPageDetail>(`/pages/${id}`, {}, noGetCache)
}

export function createPage(body: {
  folder_id?: string | null
  name: string
  type: PageType
  dsl?: Record<string, unknown>
  dataset_bindings?: PageDatasetBindings
  preview_url?: string
  status?: PageStatus
}) {
  return request.post<ApiPageDetail>('/pages', body)
}

export function updatePage(id: string, body: {
  folder_id?: string | null
  name?: string
  type?: PageType
  dsl?: Record<string, unknown>
  dataset_bindings?: PageDatasetBindings
  preview_url?: string | null
  status?: PageStatus
}) {
  return request.put<ApiPageDetail>(`/pages/${id}`, body)
}

export function deletePage(id: string) {
  return request.delete<null>(`/pages/${id}`)
}

export function fetchPageFolderTree() {
  return request.get<ApiPageFolder[]>('/pages/folders/tree', {}, noGetCache)
}

export function createPageFolder(body: {
  parent_id?: string | null
  name: string
  description?: string | null
  sort_order?: number
}) {
  return request.post<ApiPageFolder>('/pages/folders', body)
}

export function updatePageFolder(
  folderId: string,
  body: {
    parent_id?: string | null
    name?: string
    description?: string | null
    sort_order?: number
  },
) {
  return request.put<ApiPageFolder>(`/pages/folders/${folderId}`, body)
}

export function deletePageFolder(folderId: string) {
  return request.delete<null>(`/pages/folders/${folderId}`)
}

export function fetchPageRecords(
  pageId: string,
  params?: { page?: number, pageSize?: number },
) {
  return request.get<ApiPageRecordsPage>(`/pages/${pageId}/records`, params, noGetCache)
}

export function createPageRecord(
  pageId: string,
  body: { values: Record<string, string | number | boolean | null>, sort_order?: number },
) {
  return request.post<ApiFormRecord>(`/pages/${pageId}/records`, body)
}

export function updatePageRecord(
  pageId: string,
  recordId: string,
  body: { values?: Record<string, string | number | boolean | null>, sort_order?: number },
) {
  return request.put<ApiFormRecord>(`/pages/${pageId}/records/${recordId}`, body)
}

export function deletePageRecord(pageId: string, recordId: string) {
  return request.delete<null>(`/pages/${pageId}/records/${recordId}`)
}
