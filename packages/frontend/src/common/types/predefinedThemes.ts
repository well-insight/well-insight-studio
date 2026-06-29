/**
 * 预定义画布主题
 * 配色与 echarts-theme-builder/src/stores/theme.ts PRE_DEFINED_THEMES 保持一致
 * 完整 ECharts 配置从 public/echarts-themes/*.json 加载后合并
 */
import type { CanvasTheme, PredefinedThemeMeta } from './canvasTheme'
import { createDefaultBrandColorMap } from './canvasTheme'

export interface PresetDef {
  id: string
  name: string
  /** 与 echarts-theme-builder 一致的预览/回退背景 */
  bg: string
  isDark: boolean
  /** 完整图表色板 */
  colors: string[]
}

function paletteFromColors(colors: string[]) {
  return {
    primary: colors[0] ?? '#409eff',
    success: colors[1] ?? '#67c23a',
    warning: colors[2] ?? '#e6a23c',
    danger: colors[3] ?? '#f56c6c',
    info: colors[4] ?? '#909399',
  }
}

/** 与 echarts-theme-builder PRE_DEFINED_THEMES 对齐 */
export const PRESETS: PresetDef[] = [
  {
    id: 'v5',
    name: 'V5 默认',
    bg: 'rgba(0, 0, 0, 0)',
    isDark: false,
    colors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
  },
  {
    id: 'vintage',
    name: '复古',
    bg: '#fef8ef',
    isDark: false,
    colors: ['#d87c7c', '#919e8b', '#d7ab82', '#6e7074', '#61a0a8', '#efa18d', '#787464', '#cc7e63', '#724e58', '#4b565b'],
  },
  {
    id: 'dark',
    name: '暗色',
    bg: '#333',
    isDark: true,
    colors: ['#dd6b66', '#759aa0', '#e69d87', '#8dc1a9', '#ea7e53', '#eedd78', '#73a373', '#73b9bc', '#7289ab', '#91ca8c', '#f49f42'],
  },
  {
    id: 'westeros',
    name: '维斯特洛',
    bg: 'transparent',
    isDark: false,
    colors: ['#516b91', '#59c4e6', '#edafda', '#93b7e3', '#a5e7f0', '#cbb0e3'],
  },
  {
    id: 'essos',
    name: '厄斯索斯',
    bg: 'rgba(242,234,191,0.15)',
    isDark: false,
    colors: ['#893448', '#d95850', '#eb8146', '#ffb248', '#f2d643', '#ebdba4'],
  },
  {
    id: 'wonderland',
    name: '仙境',
    bg: 'transparent',
    isDark: false,
    colors: ['#4ea397', '#22c3aa', '#7bd9a5', '#d0648a', '#f58db2', '#f2b3c9'],
  },
  {
    id: 'walden',
    name: '瓦尔登湖',
    bg: 'rgba(252,252,252,0)',
    isDark: false,
    colors: ['#3fb1e3', '#6be6c1', '#626c91', '#a0a7e6', '#c4ebad', '#96dee8'],
  },
  {
    id: 'chalk',
    name: '粉笔',
    bg: '#293441',
    isDark: true,
    colors: ['#fc97af', '#87f7cf', '#f7f494', '#72ccff', '#f7c5a0', '#d4a4eb', '#d2f5a6', '#76f2f2'],
  },
  {
    id: 'infographic',
    name: '信息图',
    bg: 'transparent',
    isDark: false,
    colors: ['#C1232B', '#27727B', '#FCCE10', '#E87C25', '#B5C334', '#FE8463', '#9BCA63', '#FAD860', '#F3A43B', '#60C0DD', '#D7504B', '#C6E579', '#F4E001', '#F0805A', '#26C0C0'],
  },
  {
    id: 'macarons',
    name: '马卡龙',
    bg: 'transparent',
    isDark: false,
    colors: ['#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80', '#8d98b3', '#e5cf0d', '#97b552', '#95706d', '#dc69aa', '#07a2a4', '#9a7fd1', '#588dd5', '#f5994e', '#c05050', '#59678c', '#c9ab00', '#7eb00a', '#6f5553', '#c14089'],
  },
  {
    id: 'roma',
    name: '罗马',
    bg: 'transparent',
    isDark: false,
    colors: ['#E01F54', '#001852', '#f5e8c8', '#b8d2c7', '#c6b38e', '#a4d8c2', '#f3d999', '#d3758f', '#dcc392', '#2e4783', '#82b6e9', '#ff6347', '#a092f1', '#0a915d', '#eaf889', '#6699FF', '#ff6666', '#3cb371', '#d5b158', '#38b6b6'],
  },
  {
    id: 'shine',
    name: '闪耀',
    bg: 'transparent',
    isDark: false,
    colors: ['#c12e34', '#e6b600', '#0098d9', '#2b821d', '#005eaa', '#339ca8', '#cda819', '#32a487'],
  },
  {
    id: 'purple-passion',
    name: '紫色激情',
    bg: 'rgba(91,92,110,1)',
    isDark: true,
    colors: ['#8a7ca8', '#e098c7', '#8fd3e8', '#71669e', '#cc70af', '#7cb4cc'],
  },
  {
    id: 'halloween',
    name: '万圣节',
    bg: '#1a1a2e',
    isDark: true,
    colors: ['#ff715e', '#ffaf51', '#ffee51', '#8c6ac4', '#715c87'],
  },
]

export function isTransparentBackground(color?: string): boolean {
  if (!color?.trim())
    return true
  const normalized = color.trim().toLowerCase().replace(/\s/g, '')
  return normalized === 'transparent'
    || normalized === 'rgba(0,0,0,0)'
    || normalized === 'rgba(0,0,0,0.0)'
}

/** 主题列表预览用背景（透明色转为可见色块） */
export function resolvePreviewBg(bg: string, isDark: boolean): string {
  if (isTransparentBackground(bg))
    return isDark ? '#333333' : '#ffffff'
  if (bg.startsWith('rgba(242,234,191'))
    return '#fcf4e6'
  if (bg.startsWith('rgba(91,92,110'))
    return '#5b5c6e'
  if (bg.startsWith('rgba(252,252,252'))
    return '#fcfcfc'
  return bg
}

export const PREDEFINED_THEME_METAS: PredefinedThemeMeta[] = PRESETS.map(p => ({
  id: p.id,
  name: p.name,
  previewBg: resolvePreviewBg(p.bg, p.isDark),
  previewColors: p.colors.slice(0, 5),
  isDark: p.isDark,
}))

function createSemanticColors(isDarkMode: boolean) {
  return {
    text: {
      primary: isDarkMode ? '#e5e6e8' : '#303133',
      regular: isDarkMode ? '#c0c4cc' : '#606266',
      secondary: isDarkMode ? '#909399' : '#909399',
      placeholder: isDarkMode ? '#636466' : '#c0c4cc',
      disabled: isDarkMode ? '#4a4b4d' : '#c0c4cc',
    },
    bg: {
      page: isDarkMode ? '#1d1e1f' : '#f5f7fa',
      component: isDarkMode ? '#2a2b2d' : '#ffffff',
      overlay: isDarkMode ? '#37383a' : '#ffffff',
      hover: isDarkMode ? '#3a3b3d' : '#f0f2f5',
      selected: isDarkMode ? '#2c3e5a' : '#ecf5ff',
    },
    border: {
      base: isDarkMode ? '#4a4b4d' : '#dcdfe6',
      light: isDarkMode ? '#3a3b3d' : '#ebeef5',
      dark: isDarkMode ? '#5a5b5d' : '#c0c4cc',
    },
    fill: {
      default: isDarkMode ? '#3a3b3d' : '#f0f2f5',
      light: isDarkMode ? '#333436' : '#f5f7fa',
      dark: isDarkMode ? '#2a2b2d' : '#e8eaed',
      page: isDarkMode ? '#141516' : '#ebedf0',
    },
    shadow: {
      light: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
      medium: isDarkMode ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.1)',
      dark: isDarkMode ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.16)',
    },
  }
}

function createTheme(def: PresetDef): CanvasTheme {
  const semantic = createSemanticColors(def.isDark)
  return {
    id: def.id,
    name: def.name,
    palette: paletteFromColors(def.colors),
    ...semantic,
    chartColors: [...def.colors],
    brandColorMap: createDefaultBrandColorMap(),
    isDark: def.isDark,
  }
}

const themeMap = Object.fromEntries(PRESETS.map(p => [p.id, createTheme(p)]))

export const PREDEFINED_THEMES: Record<string, CanvasTheme> = themeMap

export function getPredefinedTheme(id: string): CanvasTheme | undefined {
  return PREDEFINED_THEMES[id]
}

export function getPredefinedThemeMetas(): PredefinedThemeMeta[] {
  return PREDEFINED_THEME_METAS
}

/** 获取预设主题对应的 ECharts JSON 文件名 */
export function getPresetEchartsJsonName(id: string): string | null {
  return PRESETS.some(p => p.id === id) ? id : null
}
