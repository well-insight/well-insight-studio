/**
 * 预设 ECharts 主题
 * 从 echarts-theme-builder 迁移的 15 种配色方案
 * JSON 文件位于 public/echarts-themes/
 */
import type { EChartsThemeData } from '@/common/types/echartsTheme'

export interface PresetEchartsThemeMeta {
  name: string
  label: string
  /** 预览色块背景 */
  bg: string
  /** 预览色点 */
  colors: string[]
  /** 是否为暗色 */
  isDark: boolean
}

/** 预设主题元信息列表 */
export const PRESET_ECHARTS_THEME_METAS: PresetEchartsThemeMeta[] = [
  { name: 'v5',         label: 'V5 默认',       bg: '#ffffff',     colors: ['#5470c6','#91cc75','#fac858','#ee6666','#73c0de'], isDark: false },
  { name: 'vintage',    label: '复古',           bg: '#fef8ef',     colors: ['#d87c7c','#919e8b','#d7ab82','#6e7074','#61a0a8'], isDark: false },
  { name: 'dark',       label: '暗色',           bg: '#333333',     colors: ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53'], isDark: true },
  { name: 'westeros',   label: '维斯特洛',       bg: '#ffffff',     colors: ['#516b91','#59c4e6','#edafda','#93b7e3','#a5e7f0'], isDark: false },
  { name: 'essos',      label: '厄斯索斯',       bg: '#fcf4e6',     colors: ['#893448','#d95850','#eb8146','#ffb248','#f2d643'], isDark: false },
  { name: 'wonderland', label: '仙境',           bg: '#ffffff',     colors: ['#4ea397','#22c3aa','#7bd9a5','#d0648a','#f58db2'], isDark: false },
  { name: 'walden',     label: '瓦尔登湖',       bg: '#fcfcfc',     colors: ['#3fb1e3','#6be6c1','#626c91','#a0a7e6','#c4ebad'], isDark: false },
  { name: 'chalk',      label: '粉笔',           bg: '#293441',     colors: ['#fc97af','#87f7cf','#f7f494','#72ccff','#f7c5a0'], isDark: true },
  { name: 'infographic',label: '信息图',         bg: '#ffffff',     colors: ['#C1232B','#27727B','#FCCE10','#E87C25','#B5C334'], isDark: false },
  { name: 'macarons',   label: '马卡龙',         bg: '#ffffff',     colors: ['#2ec7c9','#b6a2de','#5ab1ef','#ffb980','#d87a80'], isDark: false },
  { name: 'roma',       label: '罗马',           bg: '#ffffff',     colors: ['#E01F54','#001852','#f5e8c8','#b8d2c7','#c6b38e'], isDark: false },
  { name: 'shine',      label: '闪耀',           bg: '#ffffff',     colors: ['#c12e34','#e6b600','#0098d9','#2b821d','#005eaa'], isDark: false },
  { name: 'purple-passion', label: '紫色激情',   bg: '#5b5c6e',     colors: ['#8a7ca8','#e098c7','#8fd3e8','#71669e','#cc70af'], isDark: true },
  { name: 'halloween',  label: '万圣节',         bg: '#1a1a2e',     colors: ['#ff6f61','#ffb347','#4ecdc4','#95e1d3','#f38181'], isDark: true },
]

const themeCache = new Map<string, EChartsThemeData>()

/**
 * 加载预设 ECharts 主题的完整配置
 * JSON 文件异步加载后缓存
 */
export async function loadPresetEchartsTheme(name: string): Promise<EChartsThemeData | null> {
  if (themeCache.has(name)) {
    return themeCache.get(name)!
  }

  try {
    const base = import.meta.env.BASE_URL || '/'
    const url = `${base}echarts-themes/${name}.json`
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()

    // JSON 结构: { version, themeName, theme: EChartsThemeData }
    const themeData: EChartsThemeData = data.theme || data

    // 修复轴设置
    if (themeData.axes && !themeData.axis) {
      themeData.axis = themeData.axisSeperateSetting
        ? themeData.axes
        : [themeData.axes[0]!]
    }

    themeCache.set(name, themeData)
    return themeData
  }
  catch (err) {
    console.error(`[presetEchartsThemes] 加载主题 "${name}" 失败:`, err)
    return null
  }
}
