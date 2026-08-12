/** WellCube 主题工具；暗色壳层由「样式风格」appearances 驱动 */

import type { AppearanceStyleId } from './appearances'
import {
  APPEARANCE_INLINE_VAR_KEYS,

  DEFAULT_APPEARANCE,
  findAppearance,
  normalizeAppearance,
} from './appearances'

export {
  APPEARANCE_STYLES,
  type AppearanceRecommendedDefaults,
  type AppearanceStyle,
  type AppearanceStyleId,
  DEFAULT_APPEARANCE,
  findAppearance,
  normalizeAppearance,
} from './appearances'

export {
  CUBE_APP_SHELL_CSS_VARS,
  CUBE_COLORS,
  CUBE_EP_CSS_VARS,
  CUBE_FONTS,
  CUBE_ROOT_CSS_VARS,
  CUBE_WC_CSS_VARS,
} from './cubeTokens'

/** 交互主色兜底；默认主题以配色方案 breeze（清风蓝）为准 */
export const WELLCUBE_PRIMARY = '#409EFF'

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
  '--el-color-primary-rgb',
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
  const [red, green, blue] = parseHex(base)!
  const vars: Record<string, string> = {
    '--el-color-primary': base,
    '--el-color-primary-rgb': `${red}, ${green}, ${blue}`,
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

/** 将 Cube 的视觉强调色绑定到当前主色；布局与中性色仍由 appearance 注册表定义。 */
export function applyCubeColorVars(isDark: boolean, appearance: AppearanceStyleId = DEFAULT_APPEARANCE) {
  const root = document.documentElement
  if (normalizeAppearance(appearance) !== 'cube')
    return

  const primary = (alpha: number) => `rgba(var(--el-color-primary-rgb), ${alpha})`
  const vars: Record<string, string> = {
    '--cube-signal': 'var(--el-color-primary)',
    '--cube-brass': 'var(--el-color-warning)',
    '--cube-border': primary(isDark ? 0.14 : 0.22),
    '--cube-border-strong': primary(isDark ? 0.28 : 0.4),
    '--cube-fill': primary(isDark ? 0.08 : 0.06),
    '--el-border-color': primary(isDark ? 0.2 : 0.22),
    '--el-border-color-light': primary(isDark ? 0.14 : 0.16),
    '--el-border-color-lighter': primary(isDark ? 0.1 : 0.12),
    '--el-border-color-extra-light': primary(isDark ? 0.07 : 0.08),
    '--el-border-color-dark': primary(isDark ? 0.3 : 0.32),
    '--el-fill-color': primary(isDark ? 0.08 : 0.06),
    '--el-fill-color-light': primary(isDark ? 0.06 : 0.04),
    '--el-menu-hover-bg-color': primary(isDark ? 0.08 : 0.06),
    '--el-menu-active-color': 'var(--el-color-primary)',
    '--el-table-row-hover-bg-color': primary(isDark ? 0.08 : 0.05),
    '--el-table-border-color': primary(0.12),
    '--wc-border-color': primary(isDark ? 0.2 : 0.22),
    '--wc-border-color-lighter': primary(0.12),
    '--wc-accent-cyan': 'var(--el-color-primary)',
    '--wc-active-fill': primary(isDark ? 0.12 : 0.1),
    '--app-shell-bg': isDark
      ? [
          `radial-gradient(circle at 16% 18%, ${primary(0.16)}, transparent 28%)`,
          'radial-gradient(circle at 78% 10%, color-mix(in srgb, var(--el-color-warning) 18%, transparent), transparent 22%)',
          'linear-gradient(135deg, #151b27 0%, #202a3a 56%, #1b2535 100%)',
        ].join(', ')
      : [
          `radial-gradient(circle at 16% 18%, ${primary(0.1)}, transparent 26%)`,
          'radial-gradient(circle at 78% 10%, color-mix(in srgb, var(--el-color-warning) 14%, transparent), transparent 22%)',
          'linear-gradient(135deg, #f7fafc 0%, #eef3f7 56%, #f5f8fb 100%)',
        ].join(', '),
    '--app-shell-panel-bg': isDark ? 'rgba(32, 42, 58, 0.94)' : 'rgba(255, 255, 255, 0.92)',
    '--app-shell-panel-border': primary(isDark ? 0.12 : 0.16),
    '--app-shell-panel-shadow': `inset 0 0 0 1px ${primary(isDark ? 0.04 : 0.05)}`,
    '--app-shell-main-bg': isDark ? 'rgba(32, 42, 58, 0.9)' : 'rgba(255, 255, 255, 0.92)',
    '--app-shell-main-border': primary(isDark ? 0.12 : 0.16),
    '--app-shell-main-shadow': `inset 0 0 0 1px ${primary(isDark ? 0.04 : 0.05)}`,
    '--app-shell-divider': primary(isDark ? 0.1 : 0.12),
    '--app-shell-header-bg': isDark ? 'rgba(27, 37, 53, 0.78)' : 'rgba(255, 255, 255, 0.78)',
    '--app-shell-header-border': primary(isDark ? 0.1 : 0.12),
    '--logo-mark-border': primary(isDark ? 0.38 : 0.36),
    '--logo-mark-bg': primary(0.06),
    '--logo-mark-color': 'var(--el-color-primary)',
    '--menu-icon-border': primary(0.22),
    '--menu-icon-bg': primary(0.06),
    '--menu-icon-color': 'var(--el-color-primary)',
    '--menu-active-ring': primary(isDark ? 0.22 : 0.28),
    '--header-icon-border': primary(0.28),
    '--header-icon-bg': primary(0.06),
    '--header-icon-color': 'var(--el-color-primary)',
    '--header-eyebrow-color': primary(isDark ? 0.78 : 0.85),
    '--footer-avatar-border': primary(0.28),
    '--footer-avatar-bg': primary(0.1),
    '--footer-avatar-color': 'var(--el-color-primary)',
    '--footer-divider': primary(isDark ? 0.12 : 0.14),
    '--type-eyebrow': primary(isDark ? 0.84 : 0.9),
    '--workbench-hero-bg': isDark
      ? [
          `radial-gradient(circle at 18% 20%, ${primary(0.16)}, transparent 44%)`,
          'linear-gradient(135deg, #25344a 0%, #202a3a 55%, #151b27 100%)',
        ].join(', ')
      : [
          `radial-gradient(circle at 18% 20%, ${primary(0.1)}, transparent 42%)`,
          'linear-gradient(135deg, #eef5f7 0%, #f7fafc 55%, #f3f6f9 100%)',
        ].join(', '),
    '--workbench-card-bg': isDark ? 'rgba(43, 55, 74, 0.82)' : 'rgba(255, 255, 255, 0.92)',
    '--workbench-soft-bg': isDark ? 'rgba(52, 66, 87, 0.6)' : 'rgba(243, 246, 249, 0.9)',
    '--workbench-hero-border': primary(isDark ? 0.16 : 0.18),
    '--workbench-hero-eyebrow': primary(isDark ? 0.84 : 0.9),
    '--workbench-card-border': primary(isDark ? 0.12 : 0.14),
    '--workbench-soft-border': primary(isDark ? 0.1 : 0.12),
    '--workbench-hover-bg': primary(0.06),
    '--workbench-hover-border': primary(isDark ? 0.28 : 0.32),
    '--ds-accent-blue': 'var(--el-color-primary)',
    '--ds-accent-blue-rgb': 'var(--el-color-primary-rgb)',
    '--ds-border-card': primary(isDark ? 0.14 : 0.16),
    '--ds-border-card-light': primary(0.12),
    '--ds-border-card-muted': primary(0.08),
  }
  setVars(root, vars)
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
