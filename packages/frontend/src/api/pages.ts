import { request } from '@/utils'

const noGetCache = { cacheFor: 0 as const }

export type PageType = 'visualization' | 'form' | 'report'
export type PageStatus = 'draft' | 'published'

export interface ApiPageDetail {
  id: string
  name: string
  type: PageType
  dsl: Record<string, unknown>
  dataset_bindings?: Record<string, unknown> | null
  preview_url?: string | null
  status: PageStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface ApiPageListItem {
  id: string
  name: string
  type: PageType
  status: PageStatus
  created_at: string
  updated_at: string
}

export function fetchPageList(params?: {
  type?: PageType
  status?: PageStatus
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
  name: string
  type: PageType
  dsl?: Record<string, unknown>
  dataset_bindings?: Record<string, unknown>
  preview_url?: string
  status?: PageStatus
}) {
  return request.post<ApiPageDetail>('/pages', body)
}

export function updatePage(id: string, body: {
  name?: string
  type?: PageType
  dsl?: Record<string, unknown>
  dataset_bindings?: Record<string, unknown>
  preview_url?: string | null
  status?: PageStatus
}) {
  return request.put<ApiPageDetail>(`/pages/${id}`, body)
}

export function deletePage(id: string) {
  return request.delete<null>(`/pages/${id}`)
}
