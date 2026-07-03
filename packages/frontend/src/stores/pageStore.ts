import type { ApiPageItem, PageType, PageStatus } from '@/api/pages'
import { fetchPages, fetchPage, createPage, updatePage, deletePage } from '@/api/pages'
import { defineStore } from 'pinia'

export const usePageStore = defineStore('page', {
  state: () => ({
    /** 当前编辑的页面 */
    currentPage: null as ApiPageItem | null,
    /** 页面列表 */
    pageList: [] as ApiPageItem[],
    /** 列表加载状态 */
    loading: false,
    /** 分页信息 */
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
    },
  }),

  actions: {
    /** 加载页面列表 */
    async loadPageList(params?: { type?: PageType; status?: PageStatus; keyword?: string; page?: number }) {
      this.loading = true
      try {
        const res = await fetchPages({
          ...params,
          page: params?.page ?? this.pagination.page,
          pageSize: this.pagination.pageSize,
        })
        this.pageList = res.items ?? []
        this.pagination.total = res.pagination?.total ?? 0
        this.pagination.page = res.pagination?.page ?? 1
      } finally {
        this.loading = false
      }
    },

    /** 加载单个页面 */
    async loadPage(id: string): Promise<ApiPageItem> {
      const page = await fetchPage(id)
      this.currentPage = page
      return page
    },

    /** 保存页面（新建/更新） */
    async savePage(params: {
      id?: string
      name: string
      type: PageType
      dsl?: Record<string, unknown>
      dataset_bindings?: Record<string, unknown>
      status?: PageStatus
    }): Promise<ApiPageItem> {
      let page: ApiPageItem
      if (params.id) {
        page = await updatePage(params.id, {
          name: params.name,
          dsl: params.dsl,
          dataset_bindings: params.dataset_bindings,
          status: params.status,
        })
      } else {
        page = await createPage({
          name: params.name,
          type: params.type,
          dsl: params.dsl,
          dataset_bindings: params.dataset_bindings,
        })
      }
      this.currentPage = page
      return page
    },

    /** 删除页面 */
    async removePage(id: string) {
      await deletePage(id)
      this.pageList = this.pageList.filter(p => p.id !== id)
      if (this.currentPage?.id === id) {
        this.currentPage = null
      }
    },

    /** 重置当前页面 */
    resetCurrentPage() {
      this.currentPage = null
    },
  },
})
