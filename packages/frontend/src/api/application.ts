import type { VisualEditorModelValue } from '@/visual-editor/visual-editor.utils'
import { request } from '@/utils'

const noGetCache = { cacheFor: 0 as const }

export type AppStatusFilter = 'all' | 'enable' | 'disable'

export interface ApiApplicationListItem {
  id: string
  title: string
  status: number
  client_type: number
  starred: boolean
  lastUpdated: string
  created_at: string
  updated_at: string
}

export interface ApiApplicationDetail extends ApiApplicationListItem {
  schema: VisualEditorModelValue
}

export function fetchApplicationList(status: AppStatusFilter = 'all') {
  return request.get<{ items: ApiApplicationListItem[], total: number }>(
    '/applications',
    { status },
    noGetCache,
  )
}

export function fetchApplication(id: string) {
  return request.get<ApiApplicationDetail>(`/applications/${id}`, {}, noGetCache)
}

export function createApplication(body: {
  title: string
  client_type?: number
  status?: number
  schema?: Record<string, unknown>
}) {
  return request.post<ApiApplicationDetail>('/applications', body)
}

export function updateApplication(
  id: string,
  body: {
    title?: string
    client_type?: number
    status?: number
    schema?: Record<string, unknown>
    starred?: boolean
  },
) {
  return request.put<ApiApplicationDetail>(`/applications/${id}`, body)
}

export function deleteApplication(id: string) {
  return request.delete<null>(`/applications/${id}`)
}
