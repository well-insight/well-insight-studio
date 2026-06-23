import type { CanvasTheme, CanvasThemeBrandColorMap } from '@/common/types/canvasTheme'
import { createDefaultBrandColorMap } from '@/common/types/canvasTheme'
import type { EChartsThemeData } from '@/common/types/echartsTheme'
import { cloneDeep } from 'lodash-es'
import { createDefaultEchartsTheme, updateAxisSetting } from '@/common/utils/echartsThemeDefaults'

export const PALETTE_COLOR_KEYS = ['primary', 'success', 'warning', 'danger', 'info'] as const
export type PaletteColorKey = typeof PALETTE_COLOR_KEYS[number]

export const PALETTE_COLOR_LABELS = ['主色', '成功色', '警告色', '危险色', '信息色'] as const
export const BRAND_COLOR_COUNT = PALETTE_COLOR_KEYS.length

export { createDefaultBrandColorMap }

function clampIndex(index: number, length: number): number {
  if (length <= 0)
    return 0
  return Math.max(0, Math.min(index, length - 1))
}

function getColorAtIndex(colors: string[], index: number): string {
  return colors[clampIndex(index, colors.length)] ?? '#cccccc'
}

/** 从现有 palette 与色板推断映射（兼容旧数据） */
export function inferBrandColorMap(theme: CanvasTheme, colors: string[]): CanvasThemeBrandColorMap {
  const palette = theme.palette
  const infer = (color: string | undefined, fallback: number) => {
    if (!color)
      return fallback
    const idx = colors.indexOf(color)
    return idx >= 0 ? idx : fallback
  }
  return {
    primary: infer(palette?.primary, 0),
    success: infer(palette?.success, 1),
    warning: infer(palette?.warning, 2),
    danger: infer(palette?.danger, 3),
    info: infer(palette?.info, 4),
  }
}

/** 只读获取品牌色映射（不修改主题对象） */
export function readBrandColorMap(theme: CanvasTheme, colors: string[]): CanvasThemeBrandColorMap {
  const map = theme.brandColorMap ?? inferBrandColorMap(theme, colors)
  const length = Math.max(colors.length, 1)
  return {
    primary: clampIndex(map.primary, length),
    success: clampIndex(map.success, length),
    warning: clampIndex(map.warning, length),
    danger: clampIndex(map.danger, length),
    info: clampIndex(map.info, length),
  }
}

/** 确保主题包含品牌色映射 */
export function ensureBrandColorMap(theme: CanvasTheme, colors: string[]): CanvasThemeBrandColorMap {
  const clamped = readBrandColorMap(theme, colors)
  theme.brandColorMap = clamped
  return clamped
}

/** 根据映射将色板颜色写入品牌色 */
export function applyBrandColorsFromMap(theme: CanvasTheme, colors: string[]) {
  if (!theme.palette) {
    theme.palette = {
      primary: '#409eff',
      success: '#67c23a',
      warning: '#e6a23c',
      danger: '#f56c6c',
      info: '#909399',
    }
  }
  const map = ensureBrandColorMap(theme, colors)
  theme.palette.primary = getColorAtIndex(colors, map.primary)
  theme.palette.success = getColorAtIndex(colors, map.success)
  theme.palette.warning = getColorAtIndex(colors, map.warning)
  theme.palette.danger = getColorAtIndex(colors, map.danger)
  theme.palette.info = getColorAtIndex(colors, map.info)
  theme.chartColors = [...colors]
}

/** 色板删减后校正映射索引 */
export function adjustBrandColorMapAfterRemove(
  map: CanvasThemeBrandColorMap,
  removedIndex: number,
  newLength: number,
): CanvasThemeBrandColorMap {
  const adjust = (index: number) => {
    if (newLength <= 0)
      return 0
    let next = index
    if (index === removedIndex)
      next = Math.min(removedIndex, newLength - 1)
    else if (index > removedIndex)
      next = index - 1
    return clampIndex(next, newLength)
  }
  return {
    primary: adjust(map.primary),
    success: adjust(map.success),
    warning: adjust(map.warning),
    danger: adjust(map.danger),
    info: adjust(map.info),
  }
}

/** 确保色板至少有一项（仅初始化补全，不强制覆盖用户清空） */
export function ensureMinColors(colors: string[], theme: CanvasTheme): string[] {
  if (colors.length > 0)
    return [...colors]

  const fromChart = theme.chartColors ?? []
  if (fromChart.length > 0)
    return [...fromChart]

  const palette = theme.palette
  return [
    palette?.primary ?? '#409eff',
    palette?.success ?? '#67c23a',
    palette?.warning ?? '#e6a23c',
    palette?.danger ?? '#f56c6c',
    palette?.info ?? '#909399',
  ]
}

/** 初始化/规范化色板 */
export function resolveThemeColors(theme: CanvasTheme, colors: string[]): string[] {
  const normalized = ensureMinColors(colors, theme)
  applyBrandColorsFromMap(theme, normalized)
  return normalized
}

/** 获取映射到指定色板索引的品牌色（单选，至多一项） */
export function getBrandKeyForColorIndex(
  theme: CanvasTheme,
  colors: string[],
  index: number,
): PaletteColorKey | null {
  const map = readBrandColorMap(theme, colors)
  for (const key of PALETTE_COLOR_KEYS) {
    if (map[key] === index)
      return key
  }
  return null
}

/** 设置某色板项对应的品牌色（单选） */
export function setBrandKeyForColorIndex(
  theme: CanvasTheme,
  colors: string[],
  colorIndex: number,
  key: PaletteColorKey | null | undefined,
) {
  const map = { ...readBrandColorMap(theme, colors) }
  for (const k of PALETTE_COLOR_KEYS) {
    if (map[k] === colorIndex) {
      map[k] = clampIndex(PALETTE_COLOR_KEYS.indexOf(k), Math.max(colors.length, 1))
    }
  }
  if (key) {
    map[key] = clampIndex(colorIndex, Math.max(colors.length, 1))
  }
  theme.brandColorMap = map
  if (colors.length > 0) {
    applyBrandColorsFromMap(theme, colors)
  }
}

/** @deprecated 使用 setBrandKeyForColorIndex */
export function setBrandKeysForColorIndex(
  theme: CanvasTheme,
  colors: string[],
  colorIndex: number,
  selectedKeys: PaletteColorKey[],
) {
  const map = { ...readBrandColorMap(theme, colors) }
  for (const key of PALETTE_COLOR_KEYS) {
    if (map[key] === colorIndex && !selectedKeys.includes(key)) {
      map[key] = clampIndex(PALETTE_COLOR_KEYS.indexOf(key), colors.length)
    }
  }
  for (const key of selectedKeys) {
    map[key] = colorIndex
  }
  theme.brandColorMap = map
  applyBrandColorsFromMap(theme, colors)
}

/** 更新品牌色映射 */
export function setBrandColorIndex(
  theme: CanvasTheme,
  colors: string[],
  key: PaletteColorKey,
  colorIndex: number,
) {
  const map = ensureBrandColorMap(theme, colors)
  map[key] = clampIndex(colorIndex, colors.length)
  theme.brandColorMap = map
  applyBrandColorsFromMap(theme, colors)
}

/** 检测色板删除的索引（单次删除） */
export function detectRemovedColorIndex(prev: string[], next: string[]): number | null {
  if (next.length >= prev.length)
    return null
  let pi = 0
  let ni = 0
  while (pi < prev.length && ni < next.length) {
    if (prev[pi] === next[ni]) {
      pi++
      ni++
    }
    else {
      return pi
    }
  }
  if (pi < prev.length)
    return pi
  return null
}

/** 色板变更 */
export function onThemePaletteChange(theme: CanvasTheme, prevColors: string[], nextColors: string[]) {
  if (nextColors.length === 0) {
    theme.chartColors = []
    return
  }
  const removedIndex = detectRemovedColorIndex(prevColors, nextColors)
  if (removedIndex !== null && nextColors.length > 0) {
    const map = ensureBrandColorMap(theme, prevColors)
    theme.brandColorMap = adjustBrandColorMapAfterRemove(map, removedIndex, nextColors.length)
  }
  else {
    ensureBrandColorMap(theme, nextColors)
  }
  applyBrandColorsFromMap(theme, nextColors)
}

/** 确保主题包含完整的 ECharts 配置（兼容旧数据，不修改入参） */
export function ensureEchartsTheme(theme: CanvasTheme): EChartsThemeData {
  const working = cloneDeep(theme)

  if (working.echarts) {
    const data = cloneDeep(working.echarts)
    data.color = resolveThemeColors(working, data.color ?? [])
    updateAxisSetting(data)
    return data
  }

  const data = createDefaultEchartsTheme()
  data.color = resolveThemeColors(working, [...(working.chartColors ?? [])])
  data.backgroundColor = working.bg?.page ?? 'transparent'
  data.titleColor = working.text?.primary ?? '#303133'
  data.subtitleColor = working.text?.secondary ?? '#909399'
  data.legendTextColor = working.text?.primary ?? '#303133'
  data.borderColor = working.border?.base ?? '#dcdfe6'

  const textColor = working.text?.regular ?? '#606266'
  data.axes.forEach((axis) => {
    axis.axisLineColor = textColor
    axis.axisTickColor = textColor
    axis.axisLabelColor = textColor
    axis.splitLineColor = [working.border?.light ?? '#ebeef5']
  })
  updateAxisSetting(data)
  return data
}

/** 将 ECharts 主题关键字段同步回 CanvasTheme */
export function syncEchartsToCanvas(theme: CanvasTheme, echarts: EChartsThemeData) {
  theme.echarts = cloneDeep(echarts)
  applyBrandColorsFromMap(theme, echarts.color)

  if (echarts.backgroundColor && echarts.backgroundColor !== 'rgba(0, 0, 0, 0)') {
    theme.bg.page = echarts.backgroundColor
  }
  theme.text.primary = echarts.titleColor || theme.text.primary
  theme.text.secondary = echarts.subtitleColor || theme.text.secondary
  theme.border.base = echarts.borderColor || theme.border.base
}

/** 将 Element Plus 主题字段同步到 ECharts 主题（保存前调用） */
export function syncCanvasToEcharts(theme: CanvasTheme) {
  const echarts = ensureEchartsTheme(theme)
  echarts.color = resolveThemeColors(theme, echarts.color)
  if (!theme.isDark) {
    echarts.backgroundColor = theme.bg.page
  }
  echarts.titleColor = theme.text.primary
  echarts.subtitleColor = theme.text.secondary
  echarts.legendTextColor = theme.text.primary
  echarts.borderColor = theme.border.base

  const labelColor = theme.text.regular
  echarts.axes.forEach((axis) => {
    axis.axisLabelColor = labelColor
    axis.axisLineColor = theme.border.dark
    axis.axisTickColor = theme.border.dark
    axis.splitLineColor = [theme.border.light]
  })
  updateAxisSetting(echarts)
  theme.echarts = echarts
  applyBrandColorsFromMap(theme, echarts.color)
}
