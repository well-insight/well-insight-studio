import type { ApiDatasetRow } from "@/api/dataset";
import type { PropDatasetBinding } from "@/utils/datasetBinding";
import {
  coerceDatasetValue,
  getBindingDataType,
  getPropValueType,
  pickDatasetRow,
  rowFieldValue,
  rowsToSelectOptions,
  rowsToSlides,
} from "@/utils/datasetBinding";
import type { ChartBarDatum } from "@/utils/datasetChart";
import type { DatasetBindingFilter, DatasetPostCalcOp, DatasetValueOperation } from "@/utils/datasetBinding";

function parseNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  const n = Number.parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
}

function compareScalar(a: unknown, b: string, op: DatasetBindingFilter["operator"]): boolean {
  const left = formatDatasetCell(a);
  const right = b;

  switch (op) {
    case "eq":
      return left === right;
    case "ne":
      return left !== right;
    case "contains":
      return left.toLowerCase().includes(right.toLowerCase());
    case "not_contains":
      return !left.toLowerCase().includes(right.toLowerCase());
    case "empty":
      return left === "";
    case "not_empty":
      return left !== "";
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const ln = parseNumber(a);
      const rn = parseNumber(b);
      if (ln === null || rn === null) {
        return false;
      }
      if (op === "gt") return ln > rn;
      if (op === "gte") return ln >= rn;
      if (op === "lt") return ln < rn;
      return ln <= rn;
    }
    default:
      return true;
  }
}

function formatDatasetCell(v: unknown): string {
  if (v === null || v === undefined) {
    return "";
  }
  return String(v);
}

export function applyBindingFilters(
  rows: ApiDatasetRow[],
  filters: DatasetBindingFilter[] | undefined,
  nameToId: Record<string, string>,
): ApiDatasetRow[] {
  const list = filters?.filter((f) => f.field?.trim()) ?? [];
  if (list.length === 0) {
    return rows;
  }
  return rows.filter((row) =>
    list.every((f) => {
      const raw = rowFieldValue(row, f.field.trim(), nameToId);
      if (f.operator === "empty" || f.operator === "not_empty") {
        return compareScalar(raw, "", f.operator);
      }
      return compareScalar(raw, String(f.value ?? ""), f.operator);
    }),
  );
}

function applyPostCalc(value: number, op: DatasetPostCalcOp, operand: number): number {
  switch (op) {
    case "add":
      return value + operand;
    case "sub":
      return value - operand;
    case "mul":
      return value * operand;
    case "div":
      return operand === 0 ? value : value / operand;
    default:
      return value;
  }
}

function numericAgg(
  rows: ApiDatasetRow[],
  field: string,
  nameToId: Record<string, string>,
  op: "sum" | "avg" | "min" | "max",
): number {
  const nums = rows
    .map((r) => parseNumber(rowFieldValue(r, field, nameToId)))
    .filter((n): n is number => n !== null);
  if (nums.length === 0) {
    return 0;
  }
  if (op === "sum") {
    return nums.reduce((a, b) => a + b, 0);
  }
  if (op === "avg") {
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }
  if (op === "min") {
    return Math.min(...nums);
  }
  return Math.max(...nums);
}

export function resolveScalarBindingValue(
  bind: PropDatasetBinding,
  rows: ApiDatasetRow[],
  nameToId: Record<string, string>,
  valueType: "string" | "number" | "boolean" = "string",
): string | number | boolean {
  const field = bind.field.trim();
  const filtered = applyBindingFilters(rows, bind.filters, nameToId);
  const op: DatasetValueOperation = bind.valueOp ?? "cell";

  let raw: unknown;
  switch (op) {
    case "cell":
      raw = rowFieldValue(pickDatasetRow(filtered, bind.rowIndex ?? 0), field, nameToId);
      break;
    case "count":
      raw = filtered.length;
      break;
    case "distinct_count": {
      const set = new Set(
        filtered.map((r) => formatDatasetCell(rowFieldValue(r, field, nameToId))).filter(Boolean),
      );
      raw = set.size;
      break;
    }
    case "sum":
    case "avg":
    case "min":
    case "max":
      raw = numericAgg(filtered, field, nameToId, op);
      break;
    case "first":
      raw = rowFieldValue(filtered[0], field, nameToId);
      break;
    case "last":
      raw = rowFieldValue(filtered[filtered.length - 1], field, nameToId);
      break;
    default:
      raw = rowFieldValue(pickDatasetRow(filtered, bind.rowIndex ?? 0), field, nameToId);
  }

  let result = coerceDatasetValue(raw, valueType);
  if (valueType === "number" && bind.postCalc) {
    const n = typeof result === "number" ? result : (parseNumber(result) ?? 0);
    result = applyPostCalc(n, bind.postCalc.op, bind.postCalc.operand);
  }
  return result;
}

export function resolveListBindingOptions(
  bind: PropDatasetBinding,
  rows: ApiDatasetRow[],
  nameToId: Record<string, string>,
  propName: string,
) {
  const field = bind.field.trim();
  const labelField = (bind.labelField?.trim() || field).trim();
  const filtered = applyBindingFilters(rows, bind.filters, nameToId);

  if (propName === "slides") {
    return rowsToSlides(filtered, field, labelField, nameToId);
  }

  let options = rowsToSelectOptions(filtered, labelField, field, nameToId);
  if (bind.listDistinct) {
    const seen = new Set<string>();
    options = options.filter((o) => {
      const key = String(o.value);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  return options;
}

export function resolveBindingToPropValue(
  bind: PropDatasetBinding,
  propName: string,
  rows: ApiDatasetRow[],
  nameToId: Record<string, string>,
  componentKey: string,
): unknown {
  const dataType = getBindingDataType(bind, propName);
  const valueType = getPropValueType(componentKey, propName);
  if (dataType === "list") {
    return resolveListBindingOptions(bind, rows, nameToId, propName);
  }
  return resolveScalarBindingValue(bind, rows, nameToId, valueType);
}

type ChartCategoryAggOp = "sum" | "avg" | "min" | "max" | "count" | "first" | "last";

function formatChartCategory(v: unknown): string {
  if (v === null || v === undefined) {
    return "";
  }
  return String(v);
}

function parseChartNumeric(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  const n = Number.parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

function normalizeChartAggOp(op?: DatasetValueOperation): ChartCategoryAggOp {
  switch (op) {
    case "sum":
    case "avg":
    case "min":
    case "max":
    case "count":
    case "first":
    case "last":
      return op;
    default:
      return "sum";
  }
}

function aggregateChartValues(values: number[], op: ChartCategoryAggOp): number {
  if (values.length === 0) {
    return 0;
  }
  switch (op) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "avg":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    case "count":
      return values.length;
    case "first":
      return values[0];
    case "last":
      return values[values.length - 1];
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

/** 根据维度/指标绑定解析柱状图序列（合并筛选、按维度聚合指标） */
export function resolveChartBarData(
  categoryBinding: PropDatasetBinding | null | undefined,
  valueBinding: PropDatasetBinding | null | undefined,
  rows: ApiDatasetRow[],
  nameToId: Record<string, string>,
): ChartBarDatum[] {
  const catField = categoryBinding?.field?.trim();
  const valField = valueBinding?.field?.trim();
  if (!catField || !valField) {
    return [];
  }

  const mergedFilters = [
    ...(categoryBinding?.filters ?? []),
    ...(valueBinding?.filters ?? []),
  ];
  const filtered = applyBindingFilters(rows, mergedFilters, nameToId);
  const aggOp = normalizeChartAggOp(valueBinding?.valueOp);
  const postCalc = valueBinding?.postCalc;
  const countByRows = aggOp === "count";

  const groups = new Map<string, number[]>();
  for (const row of filtered) {
    const category = formatChartCategory(rowFieldValue(row, catField, nameToId));
    if (!category) {
      continue;
    }
    let value = countByRows ? 1 : parseChartNumeric(rowFieldValue(row, valField, nameToId));
    if (!countByRows && postCalc) {
      value = applyPostCalc(value, postCalc.op, postCalc.operand);
    }
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(value);
  }

  return [...groups.entries()].map(([category, values]) => ({
    category,
    value: aggregateChartValues(values, aggOp),
  }));
}
