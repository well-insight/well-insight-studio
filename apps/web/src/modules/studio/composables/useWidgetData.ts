import type { TableData, Widget } from '@well-insight/shared'
import type { ProcessedData } from '../utils/fieldOps'
import { computed, onMounted, ref, watch } from 'vue'
import { useDataStore } from '../../../styles/stores/dataStore'
import { resolveWidgetData, resolveWidgetDataAsync } from '../utils/widgetData'

/**
 * 在组件中消费 widget 数据：
 * - 同步返回本地/缓存数据，保证渲染不阻塞。
 * - 首次挂载或 widget 数据配置变化时触发后端查询刷新。
 */
export function useWidgetData(widget: Widget, table: TableData) {
  const dataStore = useDataStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastRefreshAt = ref<Date | null>(null)

  const processed = computed<ProcessedData>(() => resolveWidgetData(widget, table))

  async function refresh() {
    if (!dataStore.datasourceId || dataStore.schemaError) return
    isLoading.value = true
    error.value = null
    try {
      await resolveWidgetDataAsync(widget, table)
      lastRefreshAt.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(refresh)

  watch(
    () => [widget.dataSource, widget.config.fieldOps, widget.config.visibleFields, dataStore.datasourceId],
    () => refresh(),
    { deep: true },
  )

  return {
    processed,
    isLoading,
    error,
    lastRefreshAt,
    refresh,
  }
}
