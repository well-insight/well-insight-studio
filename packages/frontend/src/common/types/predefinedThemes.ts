/**
 * 预定义画布主题
 * 仿照 echarts-theme-builder 的预定义主题体系设计
 */
import type { CanvasTheme, PredefinedThemeMeta } from './canvasTheme'

export const PREDEFINED_THEME_METAS: PredefinedThemeMeta[] = [
  {
    id: 'default',
    name: '默认浅色',
    previewBg: '#ffffff',
    previewColors: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'],
    isDark: false,
  },
  {
    id: 'dark',
    name: '暗色经典',
    previewBg: '#1d1e1f',
    previewColors: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#a6a7ad'],
    isDark: true,
  },
  {
    id: 'ocean',
    name: '海洋蓝',
    previewBg: '#f0f8ff',
    previewColors: ['#1e90ff', '#00ced1', '#ffa07a', '#ff6347', '#7b68ee'],
    isDark: false,
  },
  {
    id: 'sunset',
    name: '日落橙',
    previewBg: '#fdf6ec',
    previewColors: ['#e67e22', '#f39c12', '#e74c3c', '#9b59b6', '#3498db'],
    isDark: false,
  },
  {
    id: 'forest',
    name: '森林绿',
    previewBg: '#f5faf5',
    previewColors: ['#2ecc71', '#27ae60', '#1abc9c', '#3498db', '#e67e22'],
    isDark: false,
  },
  {
    id: 'purple',
    name: '优雅紫',
    previewBg: '#f5f0ff',
    previewColors: ['#7c3aed', '#a78bfa', '#ec4899', '#f59e0b', '#10b981'],
    isDark: false,
  },
  {
    id: 'midnight',
    name: '暗夜蓝',
    previewBg: '#0f1729',
    previewColors: ['#3b82f6', '#60a5fa', '#f59e0b', '#ef4444', '#10b981'],
    isDark: true,
  },
  {
    id: 'coffee',
    name: '咖啡棕',
    previewBg: '#faf8f5',
    previewColors: ['#8b6914', '#6b4c1e', '#c0392b', '#2c3e50', '#16a085'],
    isDark: false,
  },
]

/** 构建完整的画布主题对象 */
function createTheme(
  id: string,
  name: string,
  palette: { primary: string, success: string, warning: string, danger: string, info: string },
  textOverrides: Partial<{ primary: string, regular: string, secondary: string, placeholder: string, disabled: string }>,
  bgOverrides: Partial<{ page: string, component: string, overlay: string, hover: string, selected: string }>,
  borderOverrides: Partial<{ base: string, light: string, dark: string }>,
  fillOverrides: Partial<{ default: string, light: string, dark: string, page: string }>,
  shadowOverrides: Partial<{ light: string, medium: string, dark: string }>,
  chartColors: string[],
  isDark: boolean,
): CanvasTheme {
  const isDarkMode = isDark

  return {
    id,
    name,
    palette: {
      primary: palette.primary,
      success: palette.success,
      warning: palette.warning,
      danger: palette.danger,
      info: palette.info,
    },
    text: {
      primary: textOverrides.primary ?? (isDarkMode ? '#e5e6e8' : '#303133'),
      regular: textOverrides.regular ?? (isDarkMode ? '#c0c4cc' : '#606266'),
      secondary: textOverrides.secondary ?? (isDarkMode ? '#909399' : '#909399'),
      placeholder: textOverrides.placeholder ?? (isDarkMode ? '#636466' : '#c0c4cc'),
      disabled: textOverrides.disabled ?? (isDarkMode ? '#4a4b4d' : '#c0c4cc'),
    },
    bg: {
      page: bgOverrides.page ?? (isDarkMode ? '#1d1e1f' : '#f5f7fa'),
      component: bgOverrides.component ?? (isDarkMode ? '#2a2b2d' : '#ffffff'),
      overlay: bgOverrides.overlay ?? (isDarkMode ? '#37383a' : '#ffffff'),
      hover: bgOverrides.hover ?? (isDarkMode ? '#3a3b3d' : '#f0f2f5'),
      selected: bgOverrides.selected ?? (isDarkMode ? '#2c3e5a' : '#ecf5ff'),
    },
    border: {
      base: borderOverrides.base ?? (isDarkMode ? '#4a4b4d' : '#dcdfe6'),
      light: borderOverrides.light ?? (isDarkMode ? '#3a3b3d' : '#ebeef5'),
      dark: borderOverrides.dark ?? (isDarkMode ? '#5a5b5d' : '#c0c4cc'),
    },
    fill: {
      default: fillOverrides.default ?? (isDarkMode ? '#3a3b3d' : '#f0f2f5'),
      light: fillOverrides.light ?? (isDarkMode ? '#333436' : '#f5f7fa'),
      dark: fillOverrides.dark ?? (isDarkMode ? '#2a2b2d' : '#e8eaed'),
      page: fillOverrides.page ?? (isDarkMode ? '#141516' : '#ebedf0'),
    },
    shadow: {
      light: shadowOverrides.light ?? (isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)'),
      medium: shadowOverrides.medium ?? (isDarkMode ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.1)'),
      dark: shadowOverrides.dark ?? (isDarkMode ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.16)'),
    },
    chartColors,
    isDark: isDarkMode,
  }
}

/** 预定义主题全集 */
export const PREDEFINED_THEMES: Record<string, CanvasTheme> = {
  default: createTheme(
    'default', '默认浅色',
    { primary: '#409eff', success: '#67c23a', warning: '#e6a23c', danger: '#f56c6c', info: '#909399' },
    {}, {}, {}, {}, {},
    ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#5470c6', '#91cc75', '#fac858', '#ee6666'],
    false,
  ),
  dark: createTheme(
    'dark', '暗色经典',
    { primary: '#409eff', success: '#67c23a', warning: '#e6a23c', danger: '#f56c6c', info: '#a6a7ad' },
    {}, {}, {}, {}, {},
    ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#a6a7ad', '#5470c6', '#91cc75', '#fac858', '#ee6666'],
    true,
  ),
  ocean: createTheme(
    'ocean', '海洋蓝',
    { primary: '#1e90ff', success: '#00ced1', warning: '#ffa07a', danger: '#ff6347', info: '#7b68ee' },
    {}, {}, {}, {}, {},
    ['#1e90ff', '#00ced1', '#ffa07a', '#ff6347', '#7b68ee', '#87ceeb', '#48d1cc', '#ffb07c', '#8a7cee'],
    false,
  ),
  sunset: createTheme(
    'sunset', '日落橙',
    { primary: '#e67e22', success: '#27ae60', warning: '#f39c12', danger: '#e74c3c', info: '#3498db' },
    {}, {}, {}, {}, {},
    ['#e67e22', '#f39c12', '#e74c3c', '#9b59b6', '#3498db', '#d35400', '#2ecc71', '#f1c40f', '#1abc9c'],
    false,
  ),
  forest: createTheme(
    'forest', '森林绿',
    { primary: '#2ecc71', success: '#27ae60', warning: '#f39c12', danger: '#e74c3c', info: '#3498db' },
    {},
    { page: '#f5faf5' },
    {}, {}, {},
    ['#2ecc71', '#27ae60', '#1abc9c', '#3498db', '#e67e22', '#16a085', '#2980b9', '#8e44ad', '#d35400'],
    false,
  ),
  purple: createTheme(
    'purple', '优雅紫',
    { primary: '#7c3aed', success: '#10b981', warning: '#f59e0b', danger: '#ef4444', info: '#a78bfa' },
    {},
    { page: '#f5f0ff' },
    {}, {}, {},
    ['#7c3aed', '#a78bfa', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#d946ef', '#f97316', '#14b8a6'],
    false,
  ),
  midnight: createTheme(
    'midnight', '暗夜蓝',
    { primary: '#3b82f6', success: '#10b981', warning: '#f59e0b', danger: '#ef4444', info: '#60a5fa' },
    {},
    { page: '#0f1729', component: '#1a2438', overlay: '#1e293b', hover: '#253248', selected: '#1e3a5f' },
    { base: '#334155', light: '#1e293b', dark: '#475569' },
    {},
    {},
    ['#3b82f6', '#60a5fa', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'],
    true,
  ),
  coffee: createTheme(
    'coffee', '咖啡棕',
    { primary: '#8b6914', success: '#6b4c1e', warning: '#c0392b', danger: '#c0392b', info: '#2c3e50' },
    {},
    { page: '#faf8f5', component: '#ffffff' },
    { base: '#d4c5b0', light: '#e8ddd0', dark: '#b8a590' },
    { default: '#f0ebe3', light: '#f5f1ea', dark: '#e8ddd0', page: '#e0d5c8' },
    {},
    ['#8b6914', '#6b4c1e', '#c0392b', '#2c3e50', '#16a085', '#d4a017', '#8e44ad', '#d35400', '#7f8c8d'],
    false,
  ),
}

/** 获取预定义主题 */
export function getPredefinedTheme(id: string): CanvasTheme | undefined {
  return PREDEFINED_THEMES[id]
}

/** 获取所有预定义主题元信息 */
export function getPredefinedThemeMetas(): PredefinedThemeMeta[] {
  return PREDEFINED_THEME_METAS
}
