import type { ApiDatasetRow, ApiDatasetField } from "@/api/dataset";
import { fetchDatasetDetail, fetchDatasetRowsPage } from "@/api/dataset";
import type { VisualEditorBlockData } from "@/visual-editor/visual-editor.utils";
import { resolveBindingToPropValue } from "@/utils/datasetBindingResolve";
import {
  type BlockDatasetBindings,
  type PropDatasetBinding,
  buildFieldNameToIdMap,
  collectDatasetIdsFromBindings,
  isBlockDatasetBound,
  syncChartPropsFromBindings,
} from "@/utils/datasetBinding";
import { type MaybeRefOrGetter, computed, ref, toValue, watch } from "vue";

const rowsCache = new Map<string, Promise<ApiDatasetRow[]>>();
const fieldsCache = new Map<string, Promise<ApiDatasetField[]>>();

async function loadDatasetRows(datasetId: string, max = 200): Promise<ApiDatasetRow[]> {
  let pending = rowsCache.get(datasetId);
  if (!pending) {
    pending = fetchDatasetRowsPage(datasetId, 1, max).then((r) => r.rows);
    rowsCache.set(datasetId, pending);
  }
  try {
    return await pending;
  } catch (e) {
    rowsCache.delete(datasetId);
    throw e;
  }
}

async function loadDatasetFields(datasetId: string): Promise<ApiDatasetField[]> {
  let pending = fieldsCache.get(datasetId);
  if (!pending) {
    pending = fetchDatasetDetail(datasetId).then((d) => d.fields ?? []);
    fieldsCache.set(datasetId, pending);
  }
  try {
    return await pending;
  } catch (e) {
    fieldsCache.delete(datasetId);
    throw e;
  }
}

function applyBindingToProps(
  p: Record<string, unknown>,
  propName: string,
  bind: PropDatasetBinding,
  rows: ApiDatasetRow[],
  componentKey: string,
  nameToId: Record<string, string>,
) {
  p[propName] = resolveBindingToPropValue(bind, propName, rows, nameToId, componentKey);
}

/**
 * 根据组件块上的 datasetBindings 解析 props（画布/预览渲染用）
 */
export function useDatasetResolvedProps(
  componentKey: MaybeRefOrGetter<string>,
  block: MaybeRefOrGetter<VisualEditorBlockData>,
) {
  const key = computed(() => toValue(componentKey));
  const blockRef = computed(() => toValue(block));
  const bindings = computed(() => blockRef.value?.datasetBindings ?? {});

  const datasetIds = computed(() => collectDatasetIdsFromBindings(bindings.value));

  const rowsByDatasetId = ref<Record<string, ApiDatasetRow[]>>({});
  const fieldMapsByDatasetId = ref<Record<string, Record<string, string>>>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadAll() {
    const ids = datasetIds.value;
    if (ids.length === 0) {
      rowsByDatasetId.value = {};
      fieldMapsByDatasetId.value = {};
      error.value = null;
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      const entries = await Promise.all(
        ids.map(async (id) => {
          const [rows, fields] = await Promise.all([
            loadDatasetRows(id),
            loadDatasetFields(id),
          ]);
          return [id, rows, buildFieldNameToIdMap(fields)] as const;
        }),
      );
      rowsByDatasetId.value = Object.fromEntries(entries.map(([id, rows]) => [id, rows]));
      fieldMapsByDatasetId.value = Object.fromEntries(
        entries.map(([id, , nameToId]) => [id, nameToId]),
      );
    } catch (e) {
      rowsByDatasetId.value = {};
      fieldMapsByDatasetId.value = {};
      error.value = e instanceof Error ? e.message : "加载数据集失败";
    } finally {
      loading.value = false;
    }
  }

  watch(datasetIds, () => void loadAll(), { immediate: true, deep: true });
  watch(bindings, () => void loadAll(), { deep: true });

  const resolvedProps = computed(() => {
    const p = { ...(blockRef.value?.props ?? {}) } as Record<string, unknown>;
    const map = rowsByDatasetId.value;
    const fieldMaps = fieldMapsByDatasetId.value;
    const b = bindings.value;
    const compKey = key.value;

    for (const [propName, bind] of Object.entries(b)) {
      if (!bind?.datasetId?.trim() || !bind?.field?.trim()) {
        continue;
      }
      if (compKey === "bar-chart" && (propName === "categoryField" || propName === "valueField")) {
        continue;
      }
      const rows = map[bind.datasetId] ?? [];
      const nameToId = fieldMaps[bind.datasetId] ?? {};
      applyBindingToProps(p, propName, bind, rows, compKey, nameToId);
    }

    if (compKey === "bar-chart") {
      syncChartPropsFromBindings(p, b);
    }

    return p;
  });

  const datasetBound = computed(() => isBlockDatasetBound(blockRef.value));

  function refreshDataset() {
    for (const id of datasetIds.value) {
      rowsCache.delete(id);
      fieldsCache.delete(id);
    }
    return loadAll();
  }

  return {
    resolvedProps,
    datasetLoading: loading,
    datasetError: error,
    datasetBound,
    refreshDataset,
  };
}
