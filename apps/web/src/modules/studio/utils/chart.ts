import type { EChartsCoreOption } from 'echarts/core'
import type { ProcessedData } from './fieldOps'

export type ChartKind = 'bar' | 'line' | 'pie'

function cssVar(name: string): string {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function chartPalette(accent: string): string[] {
  const tokens = [
    accent,
    cssVar('--wi-color-primary'),
    cssVar('--wi-color-info'),
    cssVar('--wi-color-success'),
    cssVar('--wi-color-warning'),
    cssVar('--wi-color-danger'),
    cssVar('--wi-color-help'),
  ].filter(Boolean)

  return [...new Set(tokens)]
}

function chartTheme() {
  const border = cssVar('--wi-color-border')
  const muted = cssVar('--wi-color-text-muted')
  const surface = cssVar('--wi-color-surface')
  const text = cssVar('--wi-color-text')
  const ground = cssVar('--wi-color-ground-background')

  return {
    axisLine: border,
    axisLabel: muted,
    splitLine: border ? `color-mix(in srgb, ${border} 35%, transparent)` : '',
    tooltipBg: surface,
    tooltipBorder: border,
    tooltipText: text,
    pieLabel: muted,
    pieBorder: ground || surface,
  }
}

/** 从处理后数据中挑选维度（首个非数值列）与指标（首个数值列） */
export function pickDimAndMeas(data: ProcessedData): { dimIdx: number; measIdx: number } {
  const { fields, rows } = data
  let dimIdx = -1
  let measIdx = -1
  fields.forEach((_, i) => {
    const sample = rows[0]?.[i]
    if (typeof sample === 'number' && measIdx === -1) measIdx = i
    if (typeof sample !== 'number' && dimIdx === -1) dimIdx = i
  })
  if (dimIdx === -1) dimIdx = 0
  if (measIdx === -1) measIdx = Math.min(1, fields.length - 1)
  return { dimIdx, measIdx }
}

/** 维度分组聚合（求和），与原型渲染语义一致 */
export function groupByDim(data: ProcessedData): { categories: string[]; values: number[] } {
  const { rows } = data
  const { dimIdx, measIdx } = pickDimAndMeas(data)
  const groups = new Map<string, number>()
  for (const row of rows) {
    const key = String(row[dimIdx] ?? 'Unknown')
    const val = Number.parseFloat(String(row[measIdx])) || 0
    groups.set(key, (groups.get(key) ?? 0) + val)
  }
  const entries = [...groups.entries()].slice(0, 10)
  return {
    categories: entries.map(([k]) => k),
    values: entries.map(([, v]) => Math.round(v * 100) / 100),
  }
}

/** 生成 ECharts option（跟随 --wi-* 主题） */
export function buildChartOption(type: ChartKind, data: ProcessedData, color: string): EChartsCoreOption {
  const { categories, values } = groupByDim(data)
  const { dimIdx, measIdx } = pickDimAndMeas(data)
  const dimName = data.displayFields[dimIdx] ?? ''
  const measName = data.displayFields[measIdx] ?? ''
  const theme = chartTheme()

  const baseAxis = {
    axisLine: { lineStyle: { color: theme.axisLine } },
    axisLabel: { color: theme.axisLabel, fontSize: 10 },
    splitLine: { lineStyle: { color: theme.splitLine } },
  }

  const tooltip = {
    trigger: type === 'pie' ? 'item' : 'axis',
    backgroundColor: theme.tooltipBg,
    borderColor: theme.tooltipBorder,
    textStyle: { color: theme.tooltipText, fontSize: 11 },
  } as const

  if (type === 'pie') {
    return {
      tooltip,
      color: chartPalette(color),
      series: [{
        type: 'pie',
        radius: ['35%', '70%'],
        center: ['50%', '50%'],
        label: { color: theme.pieLabel, fontSize: 10 },
        itemStyle: { borderColor: theme.pieBorder, borderWidth: 1 },
        data: categories.map((name, i) => ({ name, value: values[i] })),
      }],
    }
  }

  return {
    tooltip,
    grid: { left: 36, right: 8, top: 18, bottom: 20 },
    xAxis: { type: 'category', data: categories, ...baseAxis, name: dimName },
    yAxis: { type: 'value', ...baseAxis, name: measName },
    series: [{
      type,
      data: values,
      itemStyle: { color, borderRadius: type === 'bar' ? [3, 3, 0, 0] : 0 },
      ...(type === 'line' ? { smooth: true, areaStyle: { color, opacity: 0.12 } } : {}),
    }],
  }
}
