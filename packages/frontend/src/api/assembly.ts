import { request } from '@/utils'

const noGetCache = { cacheFor: 0 as const }

export interface ApiMenuNode {
  id: string
  menu_title: string
  route_path: string | null
  menu_icon: string | null
  sort_order: number
  parent_id: string | null
  isFolder: boolean
  page: {
    id: string
    name: string
    type: string
    status: string
  } | null
  children: ApiMenuNode[]
}

export interface ApiMenuCreateParams {
  page_id: string
  parent_id?: string | null
  menu_title: string
  menu_icon?: string | null
  route_path?: string | null
}

export interface ApiMenuUpdateParams {
  menu_title?: string
  menu_icon?: string | null
  route_path?: string | null
  parent_id?: string | null
}

export interface ApiSortMenusParams {
  menus: Array<{
    id: string
    parent_id: string | null
    sort_order: number
  }>
}

/**
 * 获取应用菜单树
 */
export function fetchAppMenus(appId: string) {
  return request.get<ApiMenuNode[]>(
    `/applications/${appId}/menus`,
    {},
    noGetCache,
  )
}

/**
 * 挂载页面到应用菜单
 */
export function addAppMenu(appId: string, body: ApiMenuCreateParams) {
  return request.post<Record<string, unknown>>(
    `/applications/${appId}/menus`,
    body,
  )
}

/**
 * 更新菜单项
 */
export function updateAppMenu(appId: string, menuId: string, body: ApiMenuUpdateParams) {
  return request.put<Record<string, unknown>>(
    `/applications/${appId}/menus/${menuId}`,
    body,
  )
}

/**
 * 调整菜单排序/层级
 */
export function sortAppMenus(appId: string, body: ApiSortMenusParams) {
  return request.patch<ApiMenuNode[]>(
    `/applications/${appId}/menus/sort`,
    body,
  )
}

/**
 * 从应用菜单中移除页面
 */
export function removeAppMenu(appId: string, menuId: string) {
  return request.delete<null>(`/applications/${appId}/menus/${menuId}`)
}

/**
 * 发布应用
 */
export function publishApp(appId: string) {
  return request.post<{ id: string; title: string; published_at: string; menus: ApiMenuNode[] }>(
    `/applications/${appId}/publish`,
  )
}
