import type { MaybeRefOrGetter } from 'vue'
import type { ApiDatasetRow } from '@/api/dataset'
import { ref, toValue, watch } from 'vue'
import { fetchDatasetRowsPage } from '@/api/dataset'

const rowsCache = new Map<string, Promise<{ rows: ApiDatasetRow[], total: number }>>()

export function clearDatasetRowsCache(datasetId?: string) {
  if (datasetId) {
    rowsCache.delete(datasetId)
    return
  }
  rowsCache.clear()
}

export interface UseBlockDatasetSourceOptions {
  datasetId: MaybeRefOrGetter<string | undefined>
  maxRows?: number
}

export function useBlockDatasetSource(options: UseBlockDatasetSourceOptions) {
  const rows = ref<ApiDatasetRow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  async function load() {
    const id = toValue(options.datasetId)?.trim()
    if (!id) {
      rows.value = []
      total.value = 0
      error.value = null
      return
    }

    loading.value = true
    error.value = null
    try {
      const max = options.maxRows ?? 200
      let pending = rowsCache.get(id)
      if (!pending) {
        pending = fetchDatasetRowsPage(id, 1, max).then(res => ({
          rows: res.rows,
          total: res.total,
        }))
        rowsCache.set(id, pending)
      }
      const res = await pending
      rows.value = res.rows
      total.value = res.total
    }
    catch (e) {
      rowsCache.delete(id)
      rows.value = []
      total.value = 0
      error.value = e instanceof Error ? e.message : '加载数据集失败'
    }
    finally {
      loading.value = false
    }
  }

  watch(() => toValue(options.datasetId), () => void load(), { immediate: true })

  function refresh() {
    const id = toValue(options.datasetId)?.trim()
    if (id) {
      clearDatasetRowsCache(id)
    }
    return load()
  }

  return {
    rows,
    loading,
    error,
    total,
    refresh,
  }
}
