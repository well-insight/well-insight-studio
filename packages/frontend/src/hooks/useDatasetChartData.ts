import type { MaybeRefOrGetter } from 'vue'
import type { ApiDatasetRow } from '@/api/dataset'
import type { BlockDatasetBindings } from '@/utils/datasetBinding'
import type { ChartDatum } from '@/utils/datasetChart'
import { computed, ref, toValue, watch } from 'vue'
import { fetchDatasetDetail, fetchDatasetRowsPage } from '@/api/dataset'
import {

  buildFieldNameToIdMap,
} from '@/utils/datasetBinding'
import { resolveChartBarData } from '@/utils/datasetBindingResolve'
import {

  SAMPLE_BAR_CHART_DATA,
} from '@/utils/datasetChart'

export interface UseDatasetChartDataOptions {
  bindings?: MaybeRefOrGetter<BlockDatasetBindings | undefined>
  /** 未绑定数据集时是否使用示例数据 */
  useSampleData?: MaybeRefOrGetter<boolean>
  /** 单次拉取最大行数 */
  maxRows?: number
}

function isChartBindingReady(bind: { datasetId?: string, field?: string } | undefined) {
  return Boolean(bind?.datasetId?.trim() && bind?.field?.trim())
}

export function useDatasetChartData(options: UseDatasetChartDataOptions) {
  const data = ref<ChartDatum[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  const categoryBinding = computed(() => toValue(options.bindings)?.categoryField)
  const valueBinding = computed(() => toValue(options.bindings)?.valueField)

  const canLoadFromDataset = computed(() =>
    isChartBindingReady(categoryBinding.value) && isChartBindingReady(valueBinding.value),
  )

  const datasetId = computed(
    () =>
      categoryBinding.value?.datasetId?.trim()
      || valueBinding.value?.datasetId?.trim()
      || '',
  )

  async function load() {
    if (!canLoadFromDataset.value) {
      error.value = null
      total.value = 0
      if (toValue(options.useSampleData) !== false) {
        data.value = [...SAMPLE_BAR_CHART_DATA]
      }
      else {
        data.value = []
      }
      return
    }

    const id = datasetId.value
    loading.value = true
    error.value = null

    try {
      const pageSize = options.maxRows ?? 200
      const [{ rows, total: rowTotal }, detail] = await Promise.all([
        fetchDatasetRowsPage(id, 1, pageSize),
        fetchDatasetDetail(id),
      ])
      const nameToId = buildFieldNameToIdMap(detail.fields)
      data.value = resolveChartBarData(
        categoryBinding.value,
        valueBinding.value,
        rows as ApiDatasetRow[],
        nameToId,
      )
      total.value = rowTotal
      if (data.value.length === 0) {
        error.value = '当前数据集无可用数据'
      }
    }
    catch (e) {
      data.value = []
      total.value = 0
      error.value = e instanceof Error ? e.message : '加载数据集失败'
    }
    finally {
      loading.value = false
    }
  }

  watch(
    () => ({
      bindings: toValue(options.bindings),
      useSampleData: toValue(options.useSampleData),
    }),
    () => void load(),
    { immediate: true, deep: true },
  )

  return {
    data,
    loading,
    error,
    total,
    canLoadFromDataset,
    refresh: load,
  }
}
