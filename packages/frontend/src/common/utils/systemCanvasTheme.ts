/**
 * 从系统壳层主题（Element CSS 变量 + themeStore）生成画布 CanvasTheme，
 * 使可视化编辑器/预览与侧栏主题设置保持一致。
 */
import type { CanvasTheme } from '@/common/types/canvasTheme'
import { createDefaultBrandColorMap } from '@/common/types/canvasTheme'
import { findPreset } from '@/styles/theme/presets'
import { syncCanvasToEcharts } from '@/common/utils/themeBridge'

function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined')
    return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function buildChartColors(primary: string, success: string, warning: string, danger: string, info: string): string[] {
  return [
    primary,
    success,
    warning,
    danger,
    info,
    '#73c0de',
    '#3ba272',
    '#fc8452',
    '#9a60b4',
    '#ea7ccc',
  ]
}

export interface SystemCanvasThemeInput {
  isDark: boolean
  primary: string
  presetId?: string
}

/** 读取当前 DOM 上的系统主题，生成画布主题 */
export function buildSystemCanvasTheme(input: SystemCanvasThemeInput): CanvasTheme {
  const preset = input.presetId ? findPreset(input.presetId) : undefined
  const primary = input.primary || readCssVar('--el-color-primary', '#409EFF')
  const success = preset?.success || readCssVar('--el-color-success', '#67C23A')
  const warning = preset?.warning || readCssVar('--el-color-warning', '#E6A23C')
  const danger = preset?.danger || readCssVar('--el-color-danger', '#F56C6C')
  const info = readCssVar('--el-color-info', '#909399')

  const chartColors = preset?.colors?.length
    ? [primary, ...preset.colors.filter(c => c.toLowerCase() !== primary.toLowerCase())].slice(0, 10)
    : buildChartColors(primary, success, warning, danger, info)

  const theme: CanvasTheme = {
    id: 'system',
    name: '系统主题',
    isDark: input.isDark,
    palette: { primary, success, warning, danger, info },
    brandColorMap: createDefaultBrandColorMap(),
    chartColors,
    text: {
      primary: readCssVar('--el-text-color-primary', input.isDark ? '#E5EAF3' : '#303133'),
      regular: readCssVar('--el-text-color-regular', input.isDark ? '#CFD3DC' : '#606266'),
      secondary: readCssVar('--el-text-color-secondary', input.isDark ? '#A3A6AD' : '#909399'),
      placeholder: readCssVar('--el-text-color-placeholder', input.isDark ? '#8D9095' : '#A8ABB2'),
      disabled: readCssVar('--el-text-color-disabled', input.isDark ? '#6C6E72' : '#C0C4CC'),
    },
    bg: {
      page: readCssVar('--el-bg-color-page', input.isDark ? '#0C1016' : '#F2F3F5'),
      component: readCssVar('--el-bg-color', input.isDark ? '#121923' : '#FFFFFF'),
      overlay: readCssVar('--el-bg-color-overlay', input.isDark ? '#1A2433' : '#FFFFFF'),
      hover: readCssVar('--el-fill-color-light', input.isDark ? 'rgba(255,255,255,0.06)' : '#F5F7FA'),
      selected: readCssVar('--el-color-primary-light-9', input.isDark ? 'rgba(64,158,255,0.16)' : '#ECF5FF'),
    },
    border: {
      base: readCssVar('--el-border-color', input.isDark ? '#4C4D4F' : '#DCDFE6'),
      light: readCssVar('--el-border-color-lighter', input.isDark ? '#414243' : '#E4E7ED'),
      dark: readCssVar('--el-border-color-dark', input.isDark ? '#636466' : '#D4D7DE'),
    },
    fill: {
      default: readCssVar('--el-fill-color', input.isDark ? '#262727' : '#F0F2F5'),
      light: readCssVar('--el-fill-color-light', input.isDark ? '#1D1E1F' : '#F5F7FA'),
      dark: readCssVar('--el-fill-color-dark', input.isDark ? '#303030' : '#EBEDF0'),
      page: readCssVar('--el-fill-color-blank', input.isDark ? 'transparent' : '#FFFFFF'),
    },
    shadow: {
      light: readCssVar('--el-box-shadow-lighter', '0 0 6px rgba(0, 0, 0, 0.08)'),
      medium: readCssVar('--el-box-shadow-light', '0 0 12px rgba(0, 0, 0, 0.12)'),
      dark: readCssVar('--el-box-shadow', '0 0 16px rgba(0, 0, 0, 0.18)'),
    },
  }

  syncCanvasToEcharts(theme)
  return theme
}
