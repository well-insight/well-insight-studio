import { request } from '@/utils'

export interface MenuPageInfo {
  id: string
  name: string
  type: string
  status: string
}

export interface MenuTreeNode {
  id: string
  application_id: string
  page_id: string | null
  parent_id: string | null
  menu_title: string
  menu_icon: string | null
  route_path: string | null
  permission: string | null
  sort_order: number
  isFolder: boolean
  page: MenuPageInfo | null
  children: MenuTreeNode[]
}

export interface AppPageMenu {
  id: string
  application_id: string
  page_id: string
  parent_id: string | null
  menu_title: string
  menu_icon: string | null
  route_path: string | null
  permission: string | null
  sort_order: number
}

export function getAppMenus(appId: string) {
  return request.get<MenuTreeNode[]>(`/applications/${appId}/menus`)
}

export function addAppMenu(appId: string, body: {
  page_id?: string | null
  parent_id?: string | null
  menu_title: string
  menu_icon?: string
  route_path?: string
  permission?: string
  sort_order?: number
}) {
  return request.post<AppPageMenu>(`/applications/${appId}/menus`, body)
}

export function updateAppMenu(appId: string, menuId: string, body: {
  menu_title?: string
  menu_icon?: string | null
  route_path?: string | null
  permission?: string | null
  parent_id?: string | null
  sort_order?: number
}) {
  return request.put<AppPageMenu>(`/applications/${appId}/menus/${menuId}`, body)
}

export function removeAppMenu(appId: string, menuId: string) {
  return request.delete<null>(`/applications/${appId}/menus/${menuId}`)
}

export function sortAppMenus(appId: string, menus: Array<{ id: string; parent_id?: string | null; sort_order: number }>) {
  return request.patch<null>(`/applications/${appId}/menus/sort`, { menus })
}

export function publishApp(appId: string) {
  return request.post<{
    published_at: string
    version: string
    menu_count: number
    preview_url: string
  }>(`/applications/${appId}/publish`)
}
