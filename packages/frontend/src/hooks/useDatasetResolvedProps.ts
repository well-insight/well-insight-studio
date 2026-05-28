import type { ApiDatasetRow } from "@/api/dataset";
import { fetchDatasetRowsPage } from "@/api/dataset";
import type { VisualEditorBlockData } from "@/visual-editor/visual-editor.utils";
import {
  type BlockDatasetBindings,
  type PropDatasetBinding,
  coerceDatasetValue,
  collectDatasetIdsFromBindings,
  isDatasetBound,
  isPropDatasetBound,
  pickDatasetRow,
  rowFieldValue,
  rowsToSelectOptions,
  rowsToSlides,
} from "@/utils/datasetBinding";
import { COMPONENT_DATASET_MAP } from "@/utils/datasetBinding";
import { type MaybeRefOrGetter, computed, ref, toValue, watch } from "vue";

const rowsCache = new Map<string, Promise<ApiDatasetRow[]>>();

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

function getValueTypeForProp(componentKey: string, propName: string): "string" | "number" | "boolean" {
  const cfg = COMPONENT_DATASET_MAP[componentKey];
  if (cfg?.valueProp === propName && cfg.valueType) {
    return cfg.valueType;
  }
  if (propName === "percentage" || propName === "modelValue" && componentKey === "slider") {
    return "number";
  }
  if (componentKey === "switch" && propName === "modelValue") {
    return "boolean";
  }
  return "string";
}

function applyBindingToProps(
  p: Record<string, unknown>,
  propName: string,
  bind: PropDatasetBinding,
  rows: ApiDatasetRow[],
  componentKey: string,
) {
  const field = bind.field.trim();
  const labelField = (bind.labelField?.trim() || field).trim();
  const mode = bind.mode ?? (propName === "options" || propName === "slides" ? "rows" : "cell");

  if (mode === "rows") {
    if (propName === "slides") {
      p.slides = rowsToSlides(rows, field, labelField);
    } else if (propName === "options") {
      p.options = rowsToSelectOptions(rows, labelField, field);
    }
    return;
  }

  const row = pickDatasetRow(rows, bind.rowIndex ?? 0);
  const raw = rowFieldValue(row, field);
  p[propName] = coerceDatasetValue(raw, getValueTypeForProp(componentKey, propName));
}

function applyLegacyBindings(
  p: Record<string, unknown>,
  componentKey: string,
  rows: ApiDatasetRow[],
) {
  const cfg = COMPONENT_DATASET_MAP[componentKey];
  if (!cfg || !isDatasetBound(p)) {
    return;
  }

  const field = String(p.datasetField ?? "").trim();
  const rowIndex = Number(p.datasetRowIndex ?? 0);
  const labelField = String(p.datasetLabelField ?? "").trim() || field;

  if (cfg.kind === "slides" && p.datasetAsSlides !== false) {
    p.slides = rowsToSlides(rows, field, labelField);
    return;
  }
  if (cfg.kind === "options" && p.datasetAsOptions === true) {
    p[cfg.optionsProp ?? "options"] = rowsToSelectOptions(rows, labelField, field);
  }
  if (cfg.valueProp) {
    const row = pickDatasetRow(rows, rowIndex);
    p[cfg.valueProp] = coerceDatasetValue(
      rowFieldValue(row, field),
      cfg.valueType ?? "string",
    );
  }
}

function applyChartBindings(
  p: Record<string, unknown>,
  bindings: BlockDatasetBindings,
) {
  const cat = bindings.categoryField;
  const val = bindings.valueField;
  if (cat?.datasetId && cat.field) {
    p.datasetId = cat.datasetId;
    p.categoryField = cat.field;
  }
  if (val?.datasetId && val.field) {
    p.datasetId = val.datasetId;
    p.valueField = val.field;
  }
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
  const rawProps = computed(() => blockRef.value?.props ?? {});
  const bindings = computed(() => blockRef.value?.datasetBindings ?? {});

  const datasetIds = computed(() => {
    const ids = collectDatasetIdsFromBindings(bindings.value);
    const legacyId = String(rawProps.value.datasetId ?? "").trim();
    if (legacyId && !ids.includes(legacyId)) {
      ids.push(legacyId);
    }
    for (const b of Object.values(bindings.value)) {
      if (b?.datasetId && !ids.includes(b.datasetId)) {
        ids.push(b.datasetId);
      }
    }
    return ids;
  });

  const rowsByDatasetId = ref<Record<string, ApiDatasetRow[]>>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadAll() {
    const ids = datasetIds.value;
    if (ids.length === 0) {
      rowsByDatasetId.value = {};
      error.value = null;
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      const entries = await Promise.all(
        ids.map(async (id) => [id, await loadDatasetRows(id)] as const),
      );
      rowsByDatasetId.value = Object.fromEntries(entries);
    } catch (e) {
      rowsByDatasetId.value = {};
      error.value = e instanceof Error ? e.message : "加载数据集失败";
    } finally {
      loading.value = false;
    }
  }

  watch(datasetIds, () => void loadAll(), { immediate: true, deep: true });
  watch(bindings, () => void loadAll(), { deep: true });

  const resolvedProps = computed(() => {
    const p = { ...rawProps.value } as Record<string, unknown>;
    const map = rowsByDatasetId.value;
    const b = bindings.value;
    const compKey = key.value;

    for (const [propName, bind] of Object.entries(b)) {
      if (!bind?.datasetId?.trim() || !bind?.field?.trim()) {
        continue;
      }
      const rows = map[bind.datasetId] ?? [];
      if (compKey === "bar-chart" && (propName === "categoryField" || propName === "valueField")) {
        continue;
      }
      applyBindingToProps(p, propName, bind, rows, compKey);
    }

    if (compKey === "bar-chart") {
      applyChartBindings(p, b);
    } else {
      const legacyId = String(p.datasetId ?? "").trim();
      if (legacyId && map[legacyId]) {
        applyLegacyBindings(p, compKey, map[legacyId]);
      }
    }

    return p;
  });

  const datasetBound = computed(() => {
    const b = bindings.value;
    return (
      Object.keys(b).some((k) => isPropDatasetBound(blockRef.value, k)) || isDatasetBound(rawProps.value)
    );
  });

  function refreshDataset() {
    for (const id of datasetIds.value) {
      rowsCache.delete(id);
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
