import type { EChartsCoreOption } from 'echarts/core'
import type { ProcessedData } from './fieldOps'

export type ChartKind = 'bar' | 'line' | 'pie'

const FALLBACK_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#ec4899', '#14b8a6', '#f97316']

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

const baseAxis = {
  axisLine: { lineStyle: { color: '#3a4557' } },
  axisLabel: { color: '#8a9bb5', fontSize: 10 },
  splitLine: { lineStyle: { color: 'rgba(58, 69, 87, 0.35)' } },
}

/** 生成 ECharts option（暗色主题） */
export function buildChartOption(type: ChartKind, data: ProcessedData, color: string): EChartsCoreOption {
  const { categories, values } = groupByDim(data)
  const { dimIdx, measIdx } = pickDimAndMeas(data)
  const dimName = data.displayFields[dimIdx] ?? ''
  const measName = data.displayFields[measIdx] ?? ''

  const tooltip = {
    trigger: type === 'pie' ? 'item' : 'axis',
    backgroundColor: '#1a2130',
    borderColor: '#2a3448',
    textStyle: { color: '#e8edf5', fontSize: 11 },
  } as const

  if (type === 'pie') {
    return {
      tooltip,
      color: [color, ...FALLBACK_COLORS.filter(c => c !== color)],
      series: [{
        type: 'pie',
        radius: ['35%', '70%'],
        center: ['50%', '50%'],
        label: { color: '#c6d0e0', fontSize: 10 },
        itemStyle: { borderColor: '#0c111c', borderWidth: 1 },
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
