import type { ApiDatasetRow } from "@/api/dataset";
import type { VisualEditorProps } from "@/visual-editor/visual-editor.props";
import { VisualEditorPropsType } from "@/visual-editor/visual-editor.props";
import type { VisualEditorComponent } from "@/visual-editor/visual-editor.utils";
import {
  createEditorDatasetBindProp,
  createEditorDatasetFieldProp,
  createEditorInputNumberProp,
  createEditorSwitchProp,
} from "@/visual-editor/visual-editor.props";

/** 单个配置项的数据集绑定 */
export type PropDatasetBindMode = "cell" | "rows";

export interface PropDatasetBinding {
  datasetId: string;
  field: string;
  /** 取单行时的行索引，默认 0 */
  rowIndex?: number;
  /** 多行列表模式下的展示字段 */
  labelField?: string;
  mode?: PropDatasetBindMode;
}

export type BlockDatasetBindings = Record<string, PropDatasetBinding>;

/** 是否属于旧版集中式数据配置属性（已废弃，仅兼容） */
export function isDatasetConfigProp(propName: string, propConfig?: VisualEditorProps): boolean {
  if (propName.startsWith("dataset")) {
    return true;
  }
  if (propName === "categoryField" || propName === "valueField") {
    return true;
  }
  const type = propConfig?.type;
  return (
    type === VisualEditorPropsType.datasetBind || type === VisualEditorPropsType.datasetField
  );
}

/** @deprecated 已改为逐项绑定图标 */
export function componentHasDatasetConfig(_component?: VisualEditorComponent | null): boolean {
  return false;
}

/** 配置项是否展示「绑定数据源」图标 */
export function shouldShowPropDatasetBind(
  propName: string,
  propConfig: VisualEditorProps,
): boolean {
  if (isDatasetConfigProp(propName, propConfig)) {
    return false;
  }
  if (propConfig.type === VisualEditorPropsType.modelBind) {
    return false;
  }
  return true;
}

export function isRowsModeProp(propName: string, propConfig?: VisualEditorProps): boolean {
  if (propName === "options" || propName === "slides") {
    return true;
  }
  return propConfig?.type === VisualEditorPropsType.crossSortable;
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

/** 组件数据集解析方式 */
export type DatasetBindingKind =
  | "single"
  | "options"
  | "slides"
  | "chart"
  | "none";

export interface DatasetComponentBinding {
  kind: DatasetBindingKind;
  /** 单行绑定时写入的目标属性 */
  valueProp?: string;
  valueType?: "string" | "number" | "boolean";
  /** 选项类组件的选项列表属性名 */
  optionsProp?: string;
}

/** 各组件与数据集字段的映射（集中维护，便于扩展） */
export const COMPONENT_DATASET_MAP: Record<string, DatasetComponentBinding> = {
  text: { kind: "single", valueProp: "text" },
  "el-button": { kind: "single", valueProp: "textValue" },
  image: { kind: "single", valueProp: "src" },
  progress: { kind: "single", valueProp: "percentage", valueType: "number" },
  divider: { kind: "single", valueProp: "content" },
  carousel: { kind: "slides" },
  input: { kind: "single", valueProp: "modelValue" },
  switch: { kind: "single", valueProp: "modelValue", valueType: "boolean" },
  slider: { kind: "single", valueProp: "modelValue", valueType: "number" },
  rate: { kind: "single", valueProp: "modelValue", valueType: "number" },
  datetimePicker: { kind: "single", valueProp: "modelValue" },
  select: { kind: "options", valueProp: "modelValue", optionsProp: "options" },
  radio: { kind: "options", valueProp: "modelValue", optionsProp: "options" },
  checkbox: { kind: "options", valueProp: "modelValue", optionsProp: "options" },
  "bar-chart": { kind: "chart" },
  layout: { kind: "none" },
  form: { kind: "none" },
};

export type DatasetBindingFeature = "single" | "options" | "slides";

export function getDatasetBindingFeatures(componentKey: string): DatasetBindingFeature[] {
  const cfg = COMPONENT_DATASET_MAP[componentKey];
  if (!cfg || cfg.kind === "chart" || cfg.kind === "none") {
    return ["single"];
  }
  if (cfg.kind === "options") {
    return ["single", "options"];
  }
  if (cfg.kind === "slides") {
    return ["slides"];
  }
  return ["single"];
}

/** 编辑器属性面板：通用数据集配置项 */
export function createDatasetBindingProps(
  features: DatasetBindingFeature[] = ["single"],
): Record<string, VisualEditorProps> {
  const props: Record<string, VisualEditorProps> = {};

  if (features.includes("single") || features.includes("options") || features.includes("slides")) {
    props.datasetId = createEditorDatasetBindProp({
      label: "数据集",
      tips: "绑定后可用数据集字段驱动组件展示",
    });
    props.datasetField = createEditorDatasetFieldProp({
      label: "绑定字段",
      tips: "优先于静态配置；选项/轮播模式下含义见下方开关",
      datasetProp: "datasetId",
    });
    props.datasetRowIndex = createEditorInputNumberProp({
      label: "数据行索引",
      defaultValue: 0,
      min: 0,
      tips: "从 0 开始，单行展示时取该行的字段值",
    });
  }

  if (features.includes("options")) {
    props.datasetAsOptions = createEditorSwitchProp({
      label: "行作为选项列表",
      defaultValue: false,
      tips: "开启后每一行生成一个选项（需配置标签字段）",
    });
    props.datasetLabelField = createEditorDatasetFieldProp({
      label: "选项标签字段",
      datasetProp: "datasetId",
      tips: "选项显示文字；不填则与绑定字段相同",
    });
  }

  if (features.includes("slides")) {
    props.datasetRowIndex = createEditorInputNumberProp({
      label: "数据行索引",
      defaultValue: 0,
      min: 0,
      tips: "关闭「行作为轮播项」时，取该行作为单张轮播图",
    });
    props.datasetAsSlides = createEditorSwitchProp({
      label: "行作为轮播项",
      defaultValue: true,
      tips: "开启后用数据集每行生成一张轮播图",
    });
    props.datasetLabelField = createEditorDatasetFieldProp({
      label: "轮播标题字段",
      datasetProp: "datasetId",
      tips: "可选，用于图片 alt / 标题",
    });
  }

  return props;
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

export function rowFieldValue(row: ApiDatasetRow | undefined, field: string): unknown {
  if (!row || !field) {
    return undefined;
  }
  return row.values[field];
}

export interface DatasetSelectOption {
  label: string;
  value: string | number;
}

export function rowsToSelectOptions(
  rows: ApiDatasetRow[],
  labelField: string,
  valueField: string,
): DatasetSelectOption[] {
  return rows.map((row, index) => ({
    label: formatDatasetCell(row.values[labelField]) || `选项${index + 1}`,
    value: coerceDatasetValue(row.values[valueField], "string") as string | number,
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
): DatasetSlideItem[] {
  return rows
    .map((row, index) => {
      const url = formatDatasetCell(row.values[imageField]);
      if (!url) {
        return null;
      }
      const label = labelField
        ? formatDatasetCell(row.values[labelField])
        : `slide-${index + 1}`;
      return { value: url, label: label || undefined };
    })
    .filter((item): item is DatasetSlideItem => item != null);
}

export function isDatasetBound(props: Record<string, unknown>): boolean {
  const id = props.datasetId;
  const field = props.datasetField;
  return Boolean(String(id ?? "").trim() && String(field ?? "").trim());
}

/** 注册组件时不再注入集中式数据集表单项，改由各配置项绑定图标完成 */
export function injectDatasetBindingProps(widget: VisualEditorComponent): VisualEditorComponent {
  return widget;
}
