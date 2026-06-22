/**
 * 画布主题定义
 * 仿照 echarts-theme-builder 的主题体系，为画布上的组件提供统一的主题色管理
 */

/** 主题色板 */
export interface CanvasThemePalette {
  /** 主色 */
  primary: string
  /** 成功色 */
  success: string
  /** 警告色 */
  warning: string
  /** 危险色 */
  danger: string
  /** 信息色 */
  info: string
}

/** 文字颜色 */
export interface CanvasThemeText {
  /** 主要文字（标题/高 Emphasis） */
  primary: string
  /** 常规文字（正文） */
  regular: string
  /** 次要文字（描述） */
  secondary: string
  /** 占位符文字 */
  placeholder: string
  /** 禁用文字 */
  disabled: string
}

/** 背景颜色 */
export interface CanvasThemeBg {
  /** 页面背景 */
  page: string
  /** 组件卡片背景 */
  component: string
  /** 叠加层背景（弹窗/下拉） */
  overlay: string
  /** 悬停态背景 */
  hover: string
  /** 选中态背景 */
  selected: string
}

/** 边框颜色 */
export interface CanvasThemeBorder {
  /** 基础边框 */
  base: string
  /** 浅色边框 */
  light: string
  /** 较深边框 */
  dark: string
}

/** 填充色（图标区域/标签背景等） */
export interface CanvasThemeFill {
  /** 默认填充 */
  default: string
  /** 浅填充 */
  light: string
  /** 深填充 */
  dark: string
  /** 页面底色填充 */
  page: string
}

/** 阴影 */
export interface CanvasThemeShadow {
  /** 浅阴影 */
  light: string
  /** 中等阴影 */
  medium: string
  /** 深阴影 */
  dark: string
}

/** 完整画布主题定义 */
export interface CanvasTheme {
  /** 主题唯一标识 */
  id: string
  /** 主题名称 */
  name: string
  /** 主题色板 */
  palette: CanvasThemePalette
  /** 文字颜色 */
  text: CanvasThemeText
  /** 背景颜色 */
  bg: CanvasThemeBg
  /** 边框颜色 */
  border: CanvasThemeBorder
  /** 填充色 */
  fill: CanvasThemeFill
  /** 阴影 */
  shadow: CanvasThemeShadow
  /** 图表调色板（用于 ECharts 等图表组件） */
  chartColors: string[]
  /** 是否暗色主题 */
  isDark: boolean
}

/** 预定义主题元信息（用于主题选择器展示） */
export interface PredefinedThemeMeta {
  id: string
  name: string
  /** 展示用背景色 */
  previewBg: string
  /** 展示用色点 */
  previewColors: string[]
  /** 是否为暗色 */
  isDark: boolean
}

/** CSS 变量映射表（theme -> CSS variable name） */
export const THEME_CSS_VARS: Record<string, string> = {
  'palette.primary': '--canvas-color-primary',
  'palette.success': '--canvas-color-success',
  'palette.warning': '--canvas-color-warning',
  'palette.danger': '--canvas-color-danger',
  'palette.info': '--canvas-color-info',
  'text.primary': '--canvas-text-primary',
  'text.regular': '--canvas-text-regular',
  'text.secondary': '--canvas-text-secondary',
  'text.placeholder': '--canvas-text-placeholder',
  'text.disabled': '--canvas-text-disabled',
  'bg.page': '--canvas-bg-page',
  'bg.component': '--canvas-bg-component',
  'bg.overlay': '--canvas-bg-overlay',
  'bg.hover': '--canvas-bg-hover',
  'bg.selected': '--canvas-bg-selected',
  'border.base': '--canvas-border-base',
  'border.light': '--canvas-border-light',
  'border.dark': '--canvas-border-dark',
  'fill.default': '--canvas-fill-default',
  'fill.light': '--canvas-fill-light',
  'fill.dark': '--canvas-fill-dark',
  'fill.page': '--canvas-fill-page',
  'shadow.light': '--canvas-shadow-light',
  'shadow.medium': '--canvas-shadow-medium',
  'shadow.dark': '--canvas-shadow-dark',
}

/**
 * Element Plus CSS 变量与画布主题字段的映射
 * 使得画布上的 Element Plus 组件自动跟随主题变化
 */
const EL_VAR_MAP: Record<string, string> = {
  '--el-color-primary': 'palette.primary',
  '--el-color-success': 'palette.success',
  '--el-color-warning': 'palette.warning',
  '--el-color-danger': 'palette.danger',
  '--el-color-info': 'palette.info',
  '--el-text-color-primary': 'text.primary',
  '--el-text-color-regular': 'text.regular',
  '--el-text-color-secondary': 'text.secondary',
  '--el-text-color-placeholder': 'text.placeholder',
  '--el-text-color-disabled': 'text.disabled',
  '--el-bg-color': 'bg.page',
  '--el-bg-color-overlay': 'bg.overlay',
  '--el-bg-color-page': 'bg.page',
  '--el-border-color': 'border.base',
  '--el-border-color-light': 'border.light',
  '--el-border-color-lighter': 'border.light',
  '--el-border-color-dark': 'border.dark',
  '--el-border-color-extra-light': 'border.light',
  '--el-fill-color': 'fill.default',
  '--el-fill-color-light': 'fill.light',
  '--el-fill-color-lighter': 'fill.light',
  '--el-fill-color-dark': 'fill.dark',
  '--el-fill-color-page': 'fill.page',
  '--el-box-shadow-lighter': 'shadow.light',
  '--el-box-shadow-light': 'shadow.light',
  '--el-box-shadow': 'shadow.medium',
  '--el-box-shadow-dark': 'shadow.dark',
}

/** 在 theme 对象中按路径取值 */
function resolveThemeValue(theme: CanvasTheme, dotPath: string): string | undefined {
  const keys = dotPath.split('.')
  let value: any = theme
  for (const key of keys) {
    value = value?.[key]
  }
  return typeof value === 'string' ? value : undefined
}

/** 将主题转换为 CSS 变量键值对（包含 Element Plus 兼容变量） */
export function themeToCSSVars(theme: CanvasTheme): Record<string, string> {
  const vars: Record<string, string> = {}
  // 1. 输出自定义 --canvas-* 变量
  Object.entries(THEME_CSS_VARS).forEach(([path, cssVar]) => {
    const value = resolveThemeValue(theme, path)
    if (value) {
      vars[cssVar] = value
    }
  })

  // 2. 输出 Element Plus 兼容 --el-* 变量
  Object.entries(EL_VAR_MAP).forEach(([elVar, path]) => {
    const value = resolveThemeValue(theme, path)
    if (value) {
      vars[elVar] = value
    }
  })

  // 3. 生成 Element Plus 颜色的浅色变体（用于 hover/active 态）
  const primaryColor = theme.palette.primary
  if (primaryColor) {
    vars['--el-color-primary-light-3'] = addAlpha(primaryColor, 0.3)
    vars['--el-color-primary-light-5'] = addAlpha(primaryColor, 0.5)
    vars['--el-color-primary-light-7'] = addAlpha(primaryColor, 0.7)
    vars['--el-color-primary-light-8'] = addAlpha(primaryColor, 0.8)
    vars['--el-color-primary-light-9'] = addAlpha(primaryColor, 0.9)
    vars['--el-color-primary-dark-2'] = darkenColor(primaryColor, 0.15)
  }

  // 4. 图表调色板
  vars['--canvas-chart-colors'] = theme.chartColors.join(',')
  vars['--canvas-is-dark'] = theme.isDark ? '1' : '0'

  return vars
}

/**
 * 给颜色添加透明度（基于 white 混合模拟）
 * 示例：addAlpha('#409eff', 0.9) → 'rgba(64, 158, 255, 0.9)' 的视觉近似
 */
function addAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) {
    return hex
  }
  // Element Plus 的 light-* 实际上是和白色混合，这里用 rgba 近似
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

/**
 * 将颜色加深一定比例
 */
function darkenColor(hex: string, ratio: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) {
    return hex
  }
  const r = Math.round(rgb.r * (1 - ratio))
  const g = Math.round(rgb.g * (1 - ratio))
  const b = Math.round(rgb.b * (1 - ratio))
  return `rgb(${r}, ${g}, ${b})`
}

/** 十六进制转 RGB */
function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6 && clean.length !== 3) {
    return null
  }
  const full = clean.length === 3
    ? clean[0]! + clean[0] + clean[1]! + clean[1] + clean[2]! + clean[2]
    : clean
  const num = Number.parseInt(full, 16)
  if (Number.isNaN(num)) {
    return null
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}
