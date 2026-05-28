import type { ApiDatasetRow } from "@/api/dataset";
import { fetchDatasetRowsPage } from "@/api/dataset";
import {
  type ChartBarDatum,
  rowsToBarChartData,
  SAMPLE_BAR_CHART_DATA,
} from "@/utils/datasetChart";
import { type MaybeRefOrGetter, computed, ref, toValue, watch } from "vue";

export interface UseDatasetChartDataOptions {
  datasetId: MaybeRefOrGetter<string | undefined>;
  categoryField: MaybeRefOrGetter<string | undefined>;
  valueField: MaybeRefOrGetter<string | undefined>;
  /** 未绑定数据集时是否使用示例数据 */
  useSampleData?: MaybeRefOrGetter<boolean>;
  /** 单次拉取最大行数 */
  maxRows?: number;
}

export function useDatasetChartData(options: UseDatasetChartDataOptions) {
  const data = ref<ChartBarDatum[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const total = ref(0);

  const canLoadFromDataset = computed(() => {
    const id = toValue(options.datasetId)?.trim();
    const cat = toValue(options.categoryField)?.trim();
    const val = toValue(options.valueField)?.trim();
    return Boolean(id && cat && val);
  });

  async function load() {
    if (!canLoadFromDataset.value) {
      error.value = null;
      total.value = 0;
      if (toValue(options.useSampleData) !== false) {
        data.value = [...SAMPLE_BAR_CHART_DATA];
      } else {
        data.value = [];
      }
      return;
    }

    const datasetId = toValue(options.datasetId)!.trim();
    const categoryField = toValue(options.categoryField)!.trim();
    const valueField = toValue(options.valueField)!.trim();
    loading.value = true;
    error.value = null;

    try {
      const pageSize = options.maxRows ?? 200;
      const { rows, total: rowTotal } = await fetchDatasetRowsPage(datasetId, 1, pageSize);
      data.value = rowsToBarChartData(rows as ApiDatasetRow[], categoryField, valueField);
      total.value = rowTotal;
      if (data.value.length === 0) {
        error.value = "当前数据集无可用数据";
      }
    } catch (e) {
      data.value = [];
      total.value = 0;
      error.value = e instanceof Error ? e.message : "加载数据集失败";
    } finally {
      loading.value = false;
    }
  }

  watch(
    () => [
      toValue(options.datasetId),
      toValue(options.categoryField),
      toValue(options.valueField),
      toValue(options.useSampleData),
    ],
    () => void load(),
    { immediate: true },
  );

  return {
    data,
    loading,
    error,
    total,
    canLoadFromDataset,
    refresh: load,
  };
}
