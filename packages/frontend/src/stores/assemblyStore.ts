import type { MenuTreeNode } from '@/api/assembly'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAppMenus, addAppMenu, updateAppMenu, removeAppMenu, sortAppMenus, publishApp } from '@/api/assembly'

export const useAssemblyStore = defineStore('assembly', () => {
  const menuTree = ref<MenuTreeNode[]>([])
  const currentAppId = ref('')

  async function loadMenus(appId: string): Promise<MenuTreeNode[]> {
    const data = await getAppMenus(appId)
    menuTree.value = data
    currentAppId.value = appId
    return data
  }

  async function addMenu(params: {
    application_id: string
    page_id?: string | null
    parent_id?: string | null
    menu_title: string
    menu_icon?: string
    route_path?: string
    permission?: string
    sort_order?: number
  }) {
    const data = await addAppMenu(params.application_id, params)
    await loadMenus(params.application_id)
    return data
  }

  async function editMenu(
    appId: string,
    menuId: string,
    params: {
      menu_title?: string
      menu_icon?: string | null
      route_path?: string | null
      permission?: string | null
      parent_id?: string | null
      sort_order?: number
    },
  ) {
    const data = await updateAppMenu(appId, menuId, params)
    await loadMenus(appId)
    return data
  }

  async function deleteMenu(appId: string, menuId: string) {
    await removeAppMenu(appId, menuId)
    await loadMenus(appId)
  }

  async function batchSort(appId: string, items: Array<{ id: string; parent_id?: string | null; sort_order: number }>) {
    await sortAppMenus(appId, items)
    await loadMenus(appId)
  }

  async function publish(appId: string) {
    const data = await publishApp(appId)
    return data
  }

  return {
    menuTree,
    currentAppId,
    loadMenus,
    addMenu,
    editMenu,
    deleteMenu,
    batchSort,
    publish,
  }
})
