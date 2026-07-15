/** WellCube / 登录页对齐的系统主题色与 Element Plus 变量工具 */

export const WELLCUBE_PRIMARY = '#2b73af'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeSize = 'large' | 'default' | 'small'

export interface ThemeConfig {
  /** 外观模式 */
  mode: ThemeMode
  /** 品牌主色（驱动 Element Plus --el-color-primary*） */
  primary: string
  /** Element Plus 全局组件尺寸 */
  size: ThemeSize
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'system',
  primary: WELLCUBE_PRIMARY,
  size: 'default',
}

/** 与 LoginBusiness 一致的暗色蓝系（覆盖 EP dark css-vars） */
export const DARK_EP_CSS_VARS: Record<string, string> = {
  '--el-bg-color-page': '#071420',
  '--el-bg-color': '#0d2840',
  '--el-bg-color-overlay': '#124066',
  '--el-text-color-primary': '#e8f4ff',
  '--el-text-color-regular': '#c8dff0',
  '--el-text-color-secondary': '#8eacc8',
  '--el-text-color-placeholder': '#6a8aa8',
  '--el-text-color-disabled': '#587490',
  '--el-border-color': 'rgba(140, 210, 255, 0.2)',
  '--el-border-color-light': 'rgba(140, 210, 255, 0.14)',
  '--el-border-color-lighter': 'rgba(140, 210, 255, 0.1)',
  '--el-border-color-extra-light': 'rgba(140, 210, 255, 0.07)',
  '--el-border-color-dark': 'rgba(140, 210, 255, 0.3)',
  '--el-fill-color': 'rgba(8, 28, 48, 0.55)',
  '--el-fill-color-light': 'rgba(18, 52, 80, 0.55)',
  '--el-fill-color-lighter': 'rgba(18, 52, 80, 0.35)',
  '--el-fill-color-extra-light': 'rgba(18, 52, 80, 0.22)',
  '--el-fill-color-blank': 'transparent',
  '--el-mask-color': 'rgba(4, 12, 22, 0.72)',
  '--el-mask-color-extra-light': 'rgba(4, 12, 22, 0.4)',
  '--el-disabled-bg-color': 'rgba(8, 28, 48, 0.45)',
  '--el-disabled-text-color': '#587490',
  '--el-disabled-border-color': 'rgba(140, 210, 255, 0.12)',
  '--el-overlay-color': 'rgba(4, 12, 22, 0.8)',
  '--el-overlay-color-light': 'rgba(4, 12, 22, 0.65)',
  '--el-overlay-color-lighter': 'rgba(4, 12, 22, 0.45)',
  '--el-box-shadow': '0 12px 32px rgba(4, 16, 30, 0.45)',
  '--el-box-shadow-light': '0 0 12px rgba(4, 16, 30, 0.35)',
  '--el-box-shadow-lighter': '0 0 6px rgba(4, 16, 30, 0.28)',
  '--el-box-shadow-dark':
    '0 16px 48px 16px rgba(4, 16, 30, 0.4), 0 12px 32px rgba(4, 16, 30, 0.35)',

  /* Menu */
  '--el-menu-bg-color': 'transparent',
  '--el-menu-text-color': '#c8dff0',
  '--el-menu-hover-bg-color': 'rgba(43, 115, 175, 0.18)',
  '--el-menu-hover-text-color': '#e8f4ff',
  '--el-menu-active-color': '#9ad4ff',
  '--el-menu-border-color': 'transparent',

  /* Table */
  '--el-table-bg-color': 'transparent',
  '--el-table-tr-bg-color': 'transparent',
  '--el-table-header-bg-color': 'rgba(8, 28, 48, 0.55)',
  '--el-table-row-hover-bg-color': 'rgba(43, 115, 175, 0.14)',
  '--el-table-border-color': 'rgba(140, 210, 255, 0.14)',
  '--el-table-header-text-color': '#c8dff0',
  '--el-table-text-color': '#e8f4ff',
  '--el-table-fixed-box-shadow': '0 0 10px rgba(4, 16, 30, 0.45)',

  /* Card / Dialog / Popover / Drawer */
  '--el-card-bg-color': '#0d2840',
  '--el-dialog-bg-color': '#0d2840',
  '--el-popup-modal-bg-color': 'rgba(4, 12, 22, 0.72)',

  /* Input / Button fills */
  '--el-input-bg-color': 'rgba(8, 28, 48, 0.45)',
  '--el-input-border-color': 'rgba(140, 210, 255, 0.2)',
  '--el-input-hover-border-color': 'rgba(140, 210, 255, 0.4)',
  '--el-input-focus-border-color': '#2b73af',
  '--el-button-bg-color': 'rgba(18, 52, 80, 0.65)',
  '--el-button-border-color': 'rgba(140, 210, 255, 0.22)',
  '--el-button-text-color': '#e8f4ff',
  '--el-button-hover-text-color': '#ffffff',
  '--el-button-hover-bg-color': 'rgba(43, 115, 175, 0.28)',
  '--el-button-hover-border-color': 'rgba(140, 210, 255, 0.4)',
  '--el-button-active-bg-color': 'rgba(43, 115, 175, 0.36)',
  '--el-button-active-border-color': 'rgba(140, 210, 255, 0.5)',

  /* Tabs */
  '--el-tabs-header-bg-color': 'transparent',
}

export const DARK_WC_CSS_VARS: Record<string, string> = {
  '--wc-bg-color': '#071420',
  '--wc-bg-color-secondary': '#0d2840',
  '--wc-bg-color-tertiary': '#124066',
  '--wc-text-color': '#e8f4ff',
  '--wc-text-color-secondary': '#8eacc8',
  '--wc-border-color': 'rgba(140, 210, 255, 0.2)',
  '--wc-border-color-lighter': 'rgba(140, 210, 255, 0.12)',
  '--wc-accent-cyan': '#9ad4ff',
  '--wc-glass-bg': 'rgba(12, 28, 46, 0.42)',
  '--wc-active-fill': 'rgba(43, 115, 175, 0.28)',
}

const PRIMARY_VAR_KEYS = [
  '--el-color-primary',
  '--el-color-primary-light-1',
  '--el-color-primary-light-2',
  '--el-color-primary-light-3',
  '--el-color-primary-light-4',
  '--el-color-primary-light-5',
  '--el-color-primary-light-6',
  '--el-color-primary-light-7',
  '--el-color-primary-light-8',
  '--el-color-primary-light-9',
  '--el-color-primary-dark-2',
] as const

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(raw))
    return null
  return [
    Number.parseInt(raw.slice(0, 2), 16),
    Number.parseInt(raw.slice(2, 4), 16),
    Number.parseInt(raw.slice(4, 6), 16),
  ]
}

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map(v => clampByte(v).toString(16).padStart(2, '0')).join('')}`
}

/** 与 Element Plus SCSS mix 一致：weight 为第二色占比 0~1 */
export function mixHex(color: string, other: string, weight: number) {
  const a = parseHex(color)
  const b = parseHex(other)
  if (!a || !b)
    return color
  const w = Math.max(0, Math.min(1, weight))
  return toHex(
    a[0] * (1 - w) + b[0] * w,
    a[1] * (1 - w) + b[1] * w,
    a[2] * (1 - w) + b[2] * w,
  )
}

export function buildPrimaryCssVars(primary: string, isDark = false): Record<string, string> {
  const base = parseHex(primary) ? primary : WELLCUBE_PRIMARY
  const vars: Record<string, string> = {
    '--el-color-primary': base,
  }
  // 暗色下 light-* 向页面深蓝混合，避免菜单/ButtonTabs 选中态发白
  const lightMixTarget = isDark ? '#071420' : '#ffffff'
  for (let i = 1; i <= 9; i++) {
    const weight = isDark ? Math.min(0.92, 0.35 + i * 0.07) : i / 10
    vars[`--el-color-primary-light-${i}`] = mixHex(base, lightMixTarget, weight)
  }
  vars['--el-color-primary-dark-2'] = mixHex(base, '#000000', isDark ? 0.28 : 0.2)
  return vars
}

function setVars(el: HTMLElement, vars: Record<string, string>) {
  for (const [key, value] of Object.entries(vars))
    el.style.setProperty(key, value)
}

function clearVars(el: HTMLElement, keys: readonly string[] | string[]) {
  for (const key of keys)
    el.style.removeProperty(key)
}

/** 应用主色到 document（通过 CSS 变量驱动 Element Plus） */
export function applyPrimaryColor(primary: string, isDark = false) {
  const root = document.documentElement
  setVars(root, buildPrimaryCssVars(primary, isDark))
}

/** 按明暗模式同步 EP / WellCube 深色变量 */
export function applyAppearanceVars(isDark: boolean) {
  const root = document.documentElement
  root.classList.toggle('dark', isDark)
  root.style.colorScheme = isDark ? 'dark' : 'light'

  if (isDark) {
    setVars(root, DARK_EP_CSS_VARS)
    setVars(root, DARK_WC_CSS_VARS)
  }
  else {
    clearVars(root, Object.keys(DARK_EP_CSS_VARS))
    clearVars(root, Object.keys(DARK_WC_CSS_VARS))
  }
}

export function clearPrimaryColorOverrides() {
  clearVars(document.documentElement, PRIMARY_VAR_KEYS)
}

export function prefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark')
    return true
  if (mode === 'light')
    return false
  return prefersDark()
}
