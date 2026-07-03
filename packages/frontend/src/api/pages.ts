import { request } from '@/utils'

const noGetCache = { cacheFor: 0 as const }

export type PageType = 'visualization' | 'form' | 'report'
export type PageStatus = 'draft' | 'published'

export interface ApiPageItem {
  id: string
  name: string
  type: PageType
  dsl: Record<string, unknown>
  dataset_bindings: Record<string, unknown>
  preview_url: string | null
  status: PageStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface ApiPageListResult {
  items: ApiPageItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

export interface ApiPageListParams {
  type?: PageType
  status?: PageStatus
  keyword?: string
  page?: number
  pageSize?: number
}

/** 获取页面列表 */
export function fetchPages(params: ApiPageListParams = {}) {
  return request.get<ApiPageListResult>('/pages', params, noGetCache)
}

/** 获取页面详情 */
export function fetchPage(id: string) {
  return request.get<ApiPageItem>(`/pages/${id}`, {}, noGetCache)
}

/** 创建页面 */
export function createPage(body: {
  name: string
  type: PageType
  dsl?: Record<string, unknown>
  dataset_bindings?: Record<string, unknown>
}) {
  return request.post<ApiPageItem>('/pages', body)
}

/** 更新页面 */
export function updatePage(
  id: string,
  body: {
    name?: string
    dsl?: Record<string, unknown>
    dataset_bindings?: Record<string, unknown>
    status?: PageStatus
  },
) {
  return request.put<ApiPageItem>(`/pages/${id}`, body)
}

/** 删除页面 */
export function deletePage(id: string) {
  return request.delete<null>(`/pages/${id}`)
}
