import type { ApiDatasetRow } from "@/api/dataset";

export interface ChartBarDatum {
  category: string;
  value: number;
}

/** 示例数据：未绑定数据集时在编辑器中展示 */
export const SAMPLE_BAR_CHART_DATA: ChartBarDatum[] = [
  { category: "一月", value: 120 },
  { category: "二月", value: 200 },
  { category: "三月", value: 150 },
  { category: "四月", value: 80 },
  { category: "五月", value: 170 },
  { category: "六月", value: 110 },
];

function formatCategory(v: unknown): string {
  if (v === null || v === undefined) {
    return "";
  }
  return String(v);
}

function parseNumericValue(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  const n = Number.parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

/** 将数据集行映射为柱状图序列 */
export function rowsToBarChartData(
  rows: ApiDatasetRow[],
  categoryField: string,
  valueField: string,
): ChartBarDatum[] {
  if (!categoryField || !valueField) {
    return [];
  }
  return rows.map((row) => ({
    category: formatCategory(row.values[categoryField]),
    value: parseNumericValue(row.values[valueField]),
  }));
}
