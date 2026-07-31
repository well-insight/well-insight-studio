/** WellCube 主题工具；暗色壳层由「样式风格」appearances 驱动 */

import {
  APPEARANCE_INLINE_VAR_KEYS,
  DEFAULT_APPEARANCE,
  findAppearance,
  normalizeAppearance,
  type AppearanceStyleId,
} from './appearances'

export {
  APPEARANCE_STYLES,
  DEFAULT_APPEARANCE,
  findAppearance,
  normalizeAppearance,
  type AppearanceRecommendedDefaults,
  type AppearanceStyle,
  type AppearanceStyleId,
} from './appearances'

export {
  CUBE_APP_SHELL_CSS_VARS,
  CUBE_COLORS,
  CUBE_EP_CSS_VARS,
  CUBE_FONTS,
  CUBE_ROOT_CSS_VARS,
  CUBE_WC_CSS_VARS,
} from './cubeTokens'

/** 交互主色兜底；默认主题以配色方案 iceberg 为准 */
export const WELLCUBE_PRIMARY = '#5DADE2'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeSize = 'large' | 'default' | 'small'

export interface ThemeConfig {
  mode: ThemeMode
  primary: string
  size: ThemeSize
  /** 壳层样式风格（Cube / 经典…） */
  appearance: AppearanceStyleId
  /** 配色方案 id（THEME_PRESETS.name） */
  presetId: string
  /** Element Plus 基础圆角 px */
  borderRadius: number
}

const cubeDefaults = findAppearance('cube').recommended!

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: cubeDefaults.mode,
  primary: WELLCUBE_PRIMARY,
  size: cubeDefaults.size,
  appearance: DEFAULT_APPEARANCE,
  presetId: cubeDefaults.presetId,
  borderRadius: cubeDefaults.borderRadius,
}

export function applyBorderRadiusVars(radiusPx: number) {
  const root = document.documentElement
  const val = Number.isFinite(radiusPx) ? Math.max(0, Math.round(radiusPx)) : 4
  root.style.setProperty('--el-border-radius-base', `${val}px`)
  root.style.setProperty('--el-border-radius-small', `${Math.max(1, val - 2)}px`)
  root.style.setProperty('--el-border-radius-round', `${val * 3}px`)
}

/** @deprecated 使用 findAppearance('cube').darkVars */
export const DARK_EP_CSS_VARS = findAppearance('cube').darkVars

/** @deprecated */
export const DARK_WC_CSS_VARS: Record<string, string> = {}

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
  if (!/^[0-9a-f]{6}$/i.test(raw))
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

export function buildPrimaryCssVars(
  primary: string,
  isDark = false,
  appearance: AppearanceStyleId = DEFAULT_APPEARANCE,
): Record<string, string> {
  const base = parseHex(primary) ? primary : WELLCUBE_PRIMARY
  const style = findAppearance(appearance)
  const vars: Record<string, string> = {
    '--el-color-primary': base,
  }
  const lightMixTarget = isDark ? style.primaryMixTarget : '#ffffff'
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
export function applyPrimaryColor(
  primary: string,
  isDark = false,
  appearance: AppearanceStyleId = DEFAULT_APPEARANCE,
) {
  const root = document.documentElement
  setVars(root, buildPrimaryCssVars(primary, isDark, appearance))
}

/** 按样式风格 + 明暗同步变量：chrome 始终生效，颜色随 isDark 切换 */
export function applyAppearanceVars(
  isDark: boolean,
  appearance: AppearanceStyleId = DEFAULT_APPEARANCE,
) {
  const root = document.documentElement
  const styleId = normalizeAppearance(appearance)
  const style = findAppearance(styleId)

  root.classList.toggle('dark', isDark)
  root.dataset.appearance = styleId
  root.style.colorScheme = isDark ? 'dark' : 'light'

  clearVars(root, APPEARANCE_INLINE_VAR_KEYS)
  setVars(root, style.chromeVars)
  setVars(root, isDark ? style.darkVars : style.lightVars)
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
