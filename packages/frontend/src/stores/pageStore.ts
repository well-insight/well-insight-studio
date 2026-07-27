import type { PageType, PageStatus, ApiPageDetail, ApiPageListItem } from '@/api/pages'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchPage, fetchPageList, createPage, updatePage, deletePage } from '@/api/pages'

export const usePageStore = defineStore('page', () => {
  const currentPage = ref<ApiPageDetail | null>(null)
  const pageList = ref<ApiPageListItem[]>([])

  async function loadPage(id: string): Promise<ApiPageDetail> {
    const data = await fetchPage(id)
    currentPage.value = data
    return data
  }

  async function savePage(params: {
    id?: string
    name: string
    type: PageType
    dsl?: Record<string, unknown>
    dataset_bindings?: Record<string, unknown>
    preview_url?: string
    status?: PageStatus
  }): Promise<ApiPageDetail> {
    if (params.id) {
      const { id, ...body } = params
      const data = await updatePage(id, body)
      currentPage.value = data
      return data
    }
    else {
      const data = await createPage(params)
      currentPage.value = data
      return data
    }
  }

  async function loadPageList(options?: {
    type?: PageType
    status?: PageStatus
    keyword?: string
    page?: number
    pageSize?: number
  }): Promise<{ items: ApiPageListItem[], total: number }> {
    const result = await fetchPageList(options)
    pageList.value = result.items
    return result
  }

  async function removePage(id: string): Promise<void> {
    await deletePage(id)
    pageList.value = pageList.value.filter(item => item.id !== id)
  }

  return {
    currentPage,
    pageList,
    loadPage,
    savePage,
    loadPageList,
    removePage,
  }
})
