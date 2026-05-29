import type { ApiDatasetRow } from "@/api/dataset";
import type { VisualEditorProps } from "@/visual-editor/visual-editor.props";
import { VisualEditorPropsType } from "@/visual-editor/visual-editor.props";

/** 绑定数据类型 */
export type DatasetBindingDataType = "scalar" | "list";

/** 单值取值方式 */
export type DatasetValueOperation =
  | "cell"
  | "count"
  | "distinct_count"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "first"
  | "last";

export type DatasetFilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "not_contains"
  | "empty"
  | "not_empty";

export type DatasetPostCalcOp = "add" | "sub" | "mul" | "div";

export interface DatasetBindingFilter {
  field: string;
  operator: DatasetFilterOperator;
  value?: string;
}

/** 组件块上单个属性的数据集绑定 */
export interface PropDatasetBinding {
  datasetId: string;
  dataType: DatasetBindingDataType;
  field: string;
  /** valueOp=cell 时的行索引 */
  rowIndex?: number;
  /** list：显示字段 */
  labelField?: string;
  /** scalar：取值方式，默认 cell */
  valueOp?: DatasetValueOperation;
  filters?: DatasetBindingFilter[];
  /** list：按绑定值去重 */
  listDistinct?: boolean;
  /** scalar 数值后处理 */
  postCalc?: { op: DatasetPostCalcOp; operand: number };
}

export type BlockDatasetBindings = Record<string, PropDatasetBinding>;

/** 图表组件：维度 / 指标绑定属性名 */
export const CHART_DIMENSION_PROP = "categoryField";
export const CHART_METRIC_PROP = "valueField";
export const CHART_BIND_PROPS = [CHART_DIMENSION_PROP, CHART_METRIC_PROP] as const;

const CHART_COMPONENT_KEYS = new Set<string>(["bar-chart"]);

export function isChartComponent(componentKey: string): boolean {
  return CHART_COMPONENT_KEYS.has(componentKey);
}

export function isChartBindProp(propName: string, componentKey?: string): boolean {
  return Boolean(
    componentKey &&
      isChartComponent(componentKey) &&
      (CHART_BIND_PROPS as readonly string[]).includes(propName),
  );
}

export function getChartBindings(bindings: BlockDatasetBindings | undefined) {
  return {
    dimension: bindings?.[CHART_DIMENSION_PROP] ?? null,
    metric: bindings?.[CHART_METRIC_PROP] ?? null,
  };
}

export function isChartDataBound(block: {
  datasetBindings?: BlockDatasetBindings;
  componentKey?: string;
}): boolean {
  if (!block.componentKey || !isChartComponent(block.componentKey)) {
    return false;
  }
  const { dimension, metric } = getChartBindings(block.datasetBindings);
  return Boolean(
    dimension?.datasetId?.trim() &&
      dimension?.field?.trim() &&
      metric?.datasetId?.trim() &&
      metric?.field?.trim(),
  );
}

export const DATASET_VALUE_OP_OPTIONS: {
  label: string;
  value: DatasetValueOperation;
  numeric?: boolean;
}[] = [
  { label: "指定行字段值", value: "cell" },
  { label: "计数", value: "count" },
  { label: "去重计数", value: "distinct_count" },
  { label: "求和", value: "sum", numeric: true },
  { label: "平均值", value: "avg", numeric: true },
  { label: "最小值", value: "min", numeric: true },
  { label: "最大值", value: "max", numeric: true },
  { label: "首行值", value: "first" },
  { label: "末行值", value: "last" },
];

export const DATASET_FILTER_OP_OPTIONS: {
  label: string;
  value: DatasetFilterOperator;
  noValue?: boolean;
}[] = [
  { label: "等于", value: "eq" },
  { label: "不等于", value: "ne" },
  { label: "大于", value: "gt" },
  { label: "大于等于", value: "gte" },
  { label: "小于", value: "lt" },
  { label: "小于等于", value: "lte" },
  { label: "包含", value: "contains" },
  { label: "不包含", value: "not_contains" },
  { label: "为空", value: "empty", noValue: true },
  { label: "不为空", value: "not_empty", noValue: true },
];

export const DATASET_POST_CALC_OPTIONS: { label: string; value: DatasetPostCalcOp }[] = [
  { label: "加", value: "add" },
  { label: "减", value: "sub" },
  { label: "乘", value: "mul" },
  { label: "除", value: "div" },
];

/** 图表指标：同一维度多行时的聚合方式 */
export const CHART_VALUE_AGG_OPTIONS: {
  label: string;
  value: DatasetValueOperation;
}[] = [
  { label: "求和", value: "sum" },
  { label: "平均值", value: "avg" },
  { label: "最小值", value: "min" },
  { label: "最大值", value: "max" },
  { label: "计数", value: "count" },
  { label: "取首行", value: "first" },
  { label: "取末行", value: "last" },
];

/** 属性是否应使用键值对列表绑定 */
export function isListProp(propName: string, propConfig?: VisualEditorProps): boolean {
  if (propName === "options" || propName === "slides") {
    return true;
  }
  return propConfig?.type === VisualEditorPropsType.crossSortable;
}

export function inferBindingDataType(
  propName: string,
  allowList: boolean,
  isChartField: boolean,
): DatasetBindingDataType {
  if (isChartField) {
    return "scalar";
  }
  if (allowList || isListProp(propName)) {
    return "list";
  }
  return "scalar";
}

export function getBindingDataType(
  bind: PropDatasetBinding,
  propName: string,
): DatasetBindingDataType {
  return bind.dataType ?? (isListProp(propName) ? "list" : "scalar");
}

export function getBindingTypeLabel(dataType: DatasetBindingDataType, isChartField = false): string {
  if (isChartField) {
    return "图表序列";
  }
  return dataType === "list" ? "键值对列表" : "单值";
}

/** 配置项是否展示绑定图标 */
export function shouldShowPropDatasetBind(
  propName: string,
  propConfig: VisualEditorProps,
  componentKey?: string,
): boolean {
  if (propConfig.type === VisualEditorPropsType.modelBind) {
    return false;
  }
  if (isChartBindProp(propName, componentKey)) {
    return false;
  }
  return true;
}

export function getPropDatasetBinding(
  block: { datasetBindings?: BlockDatasetBindings },
  propName: string,
): PropDatasetBinding | null {
  return block.datasetBindings?.[propName] ?? null;
}

export function isPropDatasetBound(
  block: { datasetBindings?: BlockDatasetBindings },
  propName: string,
): boolean {
  const b = getPropDatasetBinding(block, propName);
  return Boolean(b?.datasetId?.trim() && b?.field?.trim());
}

export function isBlockDatasetBound(block: { datasetBindings?: BlockDatasetBindings }): boolean {
  const bindings = block.datasetBindings;
  if (!bindings) {
    return false;
  }
  return Object.keys(bindings).some((k) => isPropDatasetBound(block, k));
}

export function collectDatasetIdsFromBindings(
  bindings: BlockDatasetBindings | undefined,
): string[] {
  if (!bindings) {
    return [];
  }
  const ids = new Set<string>();
  for (const b of Object.values(bindings)) {
    const id = b?.datasetId?.trim();
    if (id) {
      ids.add(id);
    }
  }
  return [...ids];
}

/** 各属性值类型提示（解析绑定时做类型转换） */
export const PROP_VALUE_TYPE_HINTS: Record<
  string,
  Record<string, "string" | "number" | "boolean">
> = {
  progress: { percentage: "number" },
  switch: { modelValue: "boolean" },
  slider: { modelValue: "number" },
  rate: { modelValue: "number" },
};

export function getPropValueType(
  componentKey: string,
  propName: string,
): "string" | "number" | "boolean" {
  const hint = PROP_VALUE_TYPE_HINTS[componentKey]?.[propName];
  if (hint) {
    return hint;
  }
  if (propName === "percentage") {
    return "number";
  }
  return "string";
}

/** 将图表类绑定同步到组件 props（供图表组件读取字段名与数据集 id） */
export function syncChartPropsFromBindings(
  props: Record<string, unknown>,
  bindings: BlockDatasetBindings,
): void {
  const cat = bindings.categoryField;
  const val = bindings.valueField;
  if (cat?.field) {
    props.categoryField = cat.field;
  }
  if (val?.field) {
    props.valueField = val.field;
  }
  const datasetId = cat?.datasetId?.trim() || val?.datasetId?.trim();
  if (datasetId) {
    props.datasetId = datasetId;
  }
}

export function formatDatasetCell(v: unknown): string {
  if (v === null || v === undefined) {
    return "";
  }
  return String(v);
}

export function coerceDatasetValue(
  raw: unknown,
  type: "string" | "number" | "boolean" = "string",
): string | number | boolean {
  if (raw === null || raw === undefined) {
    if (type === "number") {
      return 0;
    }
    if (type === "boolean") {
      return false;
    }
    return "";
  }
  if (type === "number") {
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return raw;
    }
    const n = Number.parseFloat(String(raw));
    return Number.isFinite(n) ? n : 0;
  }
  if (type === "boolean") {
    if (typeof raw === "boolean") {
      return raw;
    }
    const s = String(raw).trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes" || s === "是";
  }
  return formatDatasetCell(raw);
}

export function pickDatasetRow(
  rows: ApiDatasetRow[],
  rowIndex: number,
): ApiDatasetRow | undefined {
  if (rows.length === 0) {
    return undefined;
  }
  const idx = Math.min(Math.max(0, rowIndex), rows.length - 1);
  return rows[idx];
}

export function buildFieldNameToIdMap(
  fields: { id: string; name: string }[] | undefined,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of fields ?? []) {
    map[f.name] = String(f.id);
  }
  return map;
}

export function rowFieldValue(
  row: ApiDatasetRow | undefined,
  field: string,
  nameToId?: Record<string, string>,
): unknown {
  if (!row || !field) {
    return undefined;
  }
  if (Object.prototype.hasOwnProperty.call(row.values, field)) {
    return row.values[field];
  }
  const id = nameToId?.[field];
  if (id && Object.prototype.hasOwnProperty.call(row.values, id)) {
    return row.values[id];
  }
  return undefined;
}

export interface DatasetSelectOption {
  label: string;
  value: string | number;
}

export function rowsToSelectOptions(
  rows: ApiDatasetRow[],
  labelField: string,
  valueField: string,
  nameToId?: Record<string, string>,
): DatasetSelectOption[] {
  return rows.map((row, index) => ({
    label: formatDatasetCell(rowFieldValue(row, labelField, nameToId)) || `选项${index + 1}`,
    value: coerceDatasetValue(rowFieldValue(row, valueField, nameToId), "string") as string | number,
  }));
}

export interface DatasetSlideItem {
  value: string;
  label?: string;
}

export function rowsToSlides(
  rows: ApiDatasetRow[],
  imageField: string,
  labelField?: string,
  nameToId?: Record<string, string>,
): DatasetSlideItem[] {
  return rows
    .map((row, index) => {
      const url = formatDatasetCell(rowFieldValue(row, imageField, nameToId));
      if (!url) {
        return null;
      }
      const label = labelField
        ? formatDatasetCell(rowFieldValue(row, labelField, nameToId))
        : `slide-${index + 1}`;
      return { value: url, label: label || undefined };
    })
    .filter((item): item is DatasetSlideItem => item != null);
}
