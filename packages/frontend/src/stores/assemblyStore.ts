import type { ApiMenuNode, ApiMenuCreateParams, ApiMenuUpdateParams, ApiSortMenusParams } from '@/api/assembly'
import { fetchAppMenus, addAppMenu, updateAppMenu, sortAppMenus, removeAppMenu, publishApp } from '@/api/assembly'
import { defineStore } from 'pinia'

export const useAssemblyStore = defineStore('assembly', {
  state: () => ({
    /** 当前应用ID */
    currentAppId: '' as string,
    /** 菜单树 */
    menuTree: [] as ApiMenuNode[],
    /** 可用页面列表（已发布） */
    availablePages: [] as Array<{ id: string; name: string; type: string; status: string }>,
    /** 加载状态 */
    loading: false,
    /** 当前选中的菜单节点 */
    selectedNode: null as ApiMenuNode | null,
  }),

  actions: {
    /** 加载菜单树 */
    async loadMenus(appId: string) {
      this.loading = true
      this.currentAppId = appId
      try {
        this.menuTree = await fetchAppMenus(appId)
      } finally {
        this.loading = false
      }
    },

    /** 挂载页面到应用 */
    async addMenu(params: ApiMenuCreateParams & { application_id?: string }) {
      const appId = params.application_id ?? this.currentAppId
      await addAppMenu(appId, {
        page_id: params.page_id,
        parent_id: params.parent_id,
        menu_title: params.menu_title,
        menu_icon: params.menu_icon,
        route_path: params.route_path,
      })
      await this.loadMenus(appId)
    },

    /** 更新菜单项 */
    async updateMenu(menuId: string, params: ApiMenuUpdateParams) {
      await updateAppMenu(this.currentAppId, menuId, params)
      await this.loadMenus(this.currentAppId)
    },

    /** 移除菜单项 */
    async removeMenu(menuId: string) {
      await removeAppMenu(this.currentAppId, menuId)
      await this.loadMenus(this.currentAppId)
      if (this.selectedNode?.id === menuId) {
        this.selectedNode = null
      }
    },

    /** 保存排序 */
    async saveSort(menus: ApiSortMenusParams['menus']) {
      this.menuTree = await sortAppMenus(this.currentAppId, { menus })
    },

    /** 发布应用 */
    async publish() {
      return await publishApp(this.currentAppId)
    },

    /** 选中菜单节点 */
    selectNode(node: ApiMenuNode | null) {
      this.selectedNode = node
    },

    /** 重置状态 */
    reset() {
      this.currentAppId = ''
      this.menuTree = []
      this.availablePages = []
      this.selectedNode = null
    },
  },
})
