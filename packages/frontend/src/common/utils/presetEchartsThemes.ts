/**
 * 预设 ECharts 主题
 * JSON 文件位于 public/echarts-themes/（与 echarts-theme-builder/public/themes 同源）
 */
import type { EChartsThemeData } from '@/common/types/echartsTheme'
import {
  PREDEFINED_THEME_METAS,
  PRESETS,
  resolvePreviewBg,
} from '@/common/types/predefinedThemes'
import { updateAxisSetting } from '@/common/utils/echartsThemeDefaults'

export interface PresetEchartsThemeMeta {
  name: string
  label: string
  bg: string
  colors: string[]
  isDark: boolean
}

/** 预设主题元信息（与 predefinedThemes 同步） */
export const PRESET_ECHARTS_THEME_METAS: PresetEchartsThemeMeta[] = PRESETS.map(p => ({
  name: p.id,
  label: p.name,
  bg: resolvePreviewBg(p.bg, p.isDark),
  colors: p.colors.slice(0, 5),
  isDark: p.isDark,
}))

export { PREDEFINED_THEME_METAS }

const themeCache = new Map<string, EChartsThemeData>()

function normalizeEchartsTheme(raw: EChartsThemeData): EChartsThemeData {
  const theme = { ...raw }

  if (typeof theme.color === 'string')
    theme.color = [theme.color]

  const numericKeys: (keyof EChartsThemeData)[] = [
    'seriesCnt',
    'borderWidth',
    'kBorderWidth',
    'lineWidth',
    'symbolSize',
    'symbolBorderWidth',
    'graphLineWidth',
    'mapBorderWidth',
    'mapBorderWidthE',
    'tooltipAxisWidth',
    'timelineLineWidth',
    'timelineItemBorderWidth',
    'timelineControlBorderWidth',
    'gridTop',
    'gridBottom',
    'legendBottom',
  ]
  for (const key of numericKeys) {
    const val = theme[key]
    if (typeof val === 'string' && val.trim() !== '' && !Number.isNaN(Number(val)))
      ;(theme as Record<string, unknown>)[key] = Number(val)
  }

  if (theme.axes && !theme.axis) {
    theme.axis = theme.axisSeperateSetting
      ? theme.axes
      : [theme.axes[0]!]
  }
  updateAxisSetting(theme)
  return theme
}

/**
 * 加载预设 ECharts 主题的完整配置
 */
export async function loadPresetEchartsTheme(name: string): Promise<EChartsThemeData | null> {
  if (themeCache.has(name))
    return themeCache.get(name)!

  try {
    const base = import.meta.env.BASE_URL || '/'
    const url = `${base}echarts-themes/${name}.json`
    const resp = await fetch(url)
    if (!resp.ok)
      throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    const themeData = normalizeEchartsTheme((data.theme || data) as EChartsThemeData)
    themeCache.set(name, themeData)
    return themeData
  }
  catch (err) {
    console.error(`[presetEchartsThemes] 加载主题 "${name}" 失败:`, err)
    return null
  }
}
