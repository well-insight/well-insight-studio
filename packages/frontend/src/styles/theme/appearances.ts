/**
 * 壳层「样式风格」注册表。
 *
 * - chromeVars：与明暗无关（字体、圆角、Logo 形态、阴影配方等）— 选风格时始终生效
 * - lightVars / darkVars：仅颜色 — 由「外观模式」浅色/暗黑切换
 *
 * 新增风格：追加条目；组件级覆盖用 html[data-appearance="id"]（结构）
 * 与 html.dark[data-appearance="id"]（仅必要时补颜色）。
 */

import {
  CUBE_COLORS,
  CUBE_EP_CSS_VARS,
  CUBE_FONTS,
  CUBE_WC_CSS_VARS,
} from './cubeTokens'

export type AppearanceStyleId = 'cube' | 'classic'

/** 某样式风格推荐的主题默认值（选风格时可套用，也作全局默认来源） */
export interface AppearanceRecommendedDefaults {
  presetId: string
  mode: 'light' | 'dark' | 'system'
  size: 'large' | 'default' | 'small'
  /** Element Plus 基础圆角 px；4 = 小圆角 */
  borderRadius: number
}

export interface AppearanceStyle {
  id: AppearanceStyleId
  label: string
  description: string
  /** 设置面板预览色条 */
  colors: string[]
  /** 结构/气质（明暗切换也不变） */
  chromeVars: Record<string, string>
  /** 浅色色值 */
  lightVars: Record<string, string>
  /** 暗色色值 */
  darkVars: Record<string, string>
  /** 主色 light-* 向此色混合（暗色） */
  primaryMixTarget: string
  /** 该风格推荐默认（Cube = 蔚蓝 + 暗黑 + 默认尺寸 + 小圆角） */
  recommended?: AppearanceRecommendedDefaults
}

/* ---------- Cube：结构 ---------- */

const CUBE_CHROME_VARS: Record<string, string> = {
  '--cube-font-display': CUBE_FONTS.display,
  '--cube-font-mono': CUBE_FONTS.mono,
  '--app-shell-radius': '4px',
  '--logo-mark-radius': '4px',
  '--logo-stamp-display': 'inline-flex',
  '--logo-svg-display': 'none',
  /* 扁平面板：用 inset 线框代替 SaaS 投影 */
  '--app-shell-shadow-recipe': 'inset',
  '--workbench-shadow': 'none',
}

/* ---------- Cube：暗色色值 ---------- */

const CUBE_DARK_SHELL: Record<string, string> = {
  '--cube-bg-0': CUBE_COLORS.bg0,
  '--cube-bg-1': CUBE_COLORS.bg1,
  '--cube-bg-2': CUBE_COLORS.bg2,
  '--cube-text': CUBE_COLORS.text,
  '--cube-text-muted': CUBE_COLORS.textMuted,
  '--cube-text-soft': CUBE_COLORS.textSoft,
  '--cube-signal': 'var(--el-color-primary)',
  '--cube-brass': 'var(--el-color-warning)',
  '--cube-panel': CUBE_COLORS.panel,
  '--cube-ink': CUBE_COLORS.ink,
  '--cube-ink-soft': CUBE_COLORS.inkSoft,
  '--cube-border': 'rgba(var(--el-color-primary-rgb), 0.14)',
  '--cube-border-strong': 'rgba(var(--el-color-primary-rgb), 0.28)',
  '--cube-fill': 'rgba(var(--el-color-primary-rgb), 0.08)',

  '--app-shell-bg': [
    'radial-gradient(circle at 16% 18%, rgba(var(--el-color-primary-rgb), 0.16), transparent 28%)',
    'radial-gradient(circle at 78% 10%, color-mix(in srgb, var(--el-color-warning) 18%, transparent), transparent 22%)',
    'linear-gradient(135deg, #151b27 0%, #202a3a 56%, #1b2535 100%)',
  ].join(', '),
  '--app-shell-panel-bg': 'rgba(32, 42, 58, 0.94)',
  '--app-shell-panel-border': 'rgba(var(--el-color-primary-rgb), 0.12)',
  '--app-shell-panel-shadow': 'inset 0 0 0 1px rgba(var(--el-color-primary-rgb), 0.04)',
  '--app-shell-main-bg': 'rgba(32, 42, 58, 0.9)',
  '--app-shell-main-border': 'rgba(var(--el-color-primary-rgb), 0.12)',
  '--app-shell-main-shadow': 'inset 0 0 0 1px rgba(var(--el-color-primary-rgb), 0.04)',
  '--app-shell-divider': 'rgba(var(--el-color-primary-rgb), 0.1)',
  '--app-shell-setting-bg': 'transparent',
  '--app-shell-header-bg': 'rgba(27, 37, 53, 0.78)',
  '--app-shell-header-border': 'rgba(var(--el-color-primary-rgb), 0.1)',
  '--app-shell-content-bg': '#151b27',

  '--logo-mark-border': 'rgba(var(--el-color-primary-rgb), 0.38)',
  '--logo-mark-bg': 'rgba(var(--el-color-primary-rgb), 0.06)',
  '--logo-mark-color': 'var(--el-color-primary)',
  '--logo-title-color': CUBE_COLORS.text,
  '--menu-icon-border': 'rgba(var(--el-color-primary-rgb), 0.22)',
  '--menu-icon-bg': 'rgba(var(--el-color-primary-rgb), 0.06)',
  '--menu-icon-color': 'var(--el-color-primary)',
  '--menu-active-ring': 'rgba(var(--el-color-primary-rgb), 0.22)',
  '--header-icon-border': 'rgba(var(--el-color-primary-rgb), 0.28)',
  '--header-icon-bg': 'rgba(var(--el-color-primary-rgb), 0.06)',
  '--header-icon-color': 'var(--el-color-primary)',
  '--header-eyebrow-color': 'rgba(var(--el-color-primary-rgb), 0.78)',
  '--header-title-color': CUBE_COLORS.text,
  '--header-meta-color': CUBE_COLORS.textSoft,
  '--footer-avatar-border': 'rgba(var(--el-color-primary-rgb), 0.28)',
  '--footer-avatar-bg': 'rgba(var(--el-color-primary-rgb), 0.1)',
  '--footer-avatar-color': 'var(--el-color-primary)',
  '--footer-name-color': CUBE_COLORS.text,
  '--footer-meta-color': CUBE_COLORS.textSoft,
  '--footer-divider': 'rgba(var(--el-color-primary-rgb), 0.12)',

  '--type-title': CUBE_COLORS.text,
  '--type-body': 'rgba(234, 242, 255, 0.82)',
  '--type-caption': CUBE_COLORS.textSoft,
  '--type-eyebrow': 'rgba(var(--el-color-primary-rgb), 0.84)',
  '--workbench-bg': CUBE_COLORS.bg0,
  '--workbench-hero-bg': [
    'radial-gradient(circle at 18% 20%, rgba(var(--el-color-primary-rgb), 0.16), transparent 44%)',
    'linear-gradient(135deg, #25344a 0%, #202a3a 55%, #151b27 100%)',
  ].join(', '),
  '--workbench-hero-border': 'rgba(var(--el-color-primary-rgb), 0.16)',
  '--workbench-hero-title': CUBE_COLORS.text,
  '--workbench-hero-lead': CUBE_COLORS.textMuted,
  '--workbench-hero-eyebrow': 'rgba(var(--el-color-primary-rgb), 0.84)',
  '--workbench-card-bg': 'rgba(43, 55, 74, 0.82)',
  '--workbench-card-border': 'rgba(var(--el-color-primary-rgb), 0.12)',
  '--workbench-card-title': CUBE_COLORS.text,
  '--workbench-card-label': CUBE_COLORS.textMuted,
  '--workbench-card-caption': 'rgba(234, 242, 255, 0.5)',
  '--workbench-soft-bg': 'rgba(52, 66, 87, 0.6)',
  '--workbench-soft-border': 'rgba(var(--el-color-primary-rgb), 0.1)',
  '--workbench-muted': CUBE_COLORS.textSoft,
  '--workbench-hover-bg': 'rgba(var(--el-color-primary-rgb), 0.06)',
  '--workbench-hover-border': 'rgba(var(--el-color-primary-rgb), 0.28)',

  '--ds-accent-blue': 'var(--el-color-primary)',
  '--ds-accent-blue-rgb': 'var(--el-color-primary-rgb)',
  '--ds-border-card': 'rgba(var(--el-color-primary-rgb), 0.14)',
  '--ds-border-card-light': 'rgba(var(--el-color-primary-rgb), 0.12)',
  '--ds-border-card-muted': 'rgba(var(--el-color-primary-rgb), 0.08)',
  '--ds-shadow-card': '0 12px 32px rgba(4, 8, 14, 0.3)',
  '--ds-shadow-card-lg': '0 18px 48px rgba(4, 8, 14, 0.35)',
}

/* ---------- Cube：浅色色值（结构仍走 chrome：小圆角 / WC stamp / Georgia） ---------- */

const CUBE_LIGHT_SHELL: Record<string, string> = {
  '--cube-bg-0': '#f3f6f9',
  '--cube-bg-1': '#ffffff',
  '--cube-bg-2': '#e8eef5',
  '--cube-text': CUBE_COLORS.ink,
  '--cube-text-muted': CUBE_COLORS.inkSoft,
  '--cube-text-soft': 'rgba(23, 32, 45, 0.48)',
  '--cube-signal': 'var(--el-color-primary)',
  '--cube-brass': 'var(--el-color-warning)',
  '--cube-panel': CUBE_COLORS.panel,
  '--cube-ink': CUBE_COLORS.ink,
  '--cube-ink-soft': CUBE_COLORS.inkSoft,
  '--cube-border': 'rgba(var(--el-color-primary-rgb), 0.22)',
  '--cube-border-strong': 'rgba(var(--el-color-primary-rgb), 0.4)',
  '--cube-fill': 'rgba(var(--el-color-primary-rgb), 0.06)',

  '--el-bg-color-page': '#f3f6f9',
  '--el-bg-color': '#ffffff',
  '--el-bg-color-overlay': '#ffffff',
  '--el-text-color-primary': CUBE_COLORS.ink,
  '--el-text-color-regular': 'rgba(23, 32, 45, 0.82)',
  '--el-text-color-secondary': 'rgba(23, 32, 45, 0.55)',
  '--el-text-color-placeholder': 'rgba(23, 32, 45, 0.4)',
  '--el-text-color-disabled': 'rgba(23, 32, 45, 0.32)',
  '--el-border-color': 'rgba(11, 138, 154, 0.22)',
  '--el-border-color-light': 'rgba(11, 138, 154, 0.16)',
  '--el-border-color-lighter': 'rgba(11, 138, 154, 0.12)',
  '--el-border-color-extra-light': 'rgba(11, 138, 154, 0.08)',
  '--el-border-color-dark': 'rgba(11, 138, 154, 0.32)',
  '--el-fill-color': 'rgba(11, 138, 154, 0.06)',
  '--el-fill-color-light': 'rgba(11, 138, 154, 0.04)',
  '--el-fill-color-lighter': 'rgba(243, 246, 249, 0.9)',
  '--el-fill-color-extra-light': '#f3f6f9',
  '--el-fill-color-blank': 'transparent',
  '--el-menu-bg-color': 'transparent',
  '--el-form-label-color': 'rgba(23, 32, 45, 0.55)',
  '--el-menu-text-color': 'rgba(23, 32, 45, 0.78)',
  '--el-menu-hover-bg-color': 'rgba(11, 138, 154, 0.06)',
  '--el-menu-hover-text-color': CUBE_COLORS.ink,
  '--el-menu-active-color': '#0b8a9a',
  '--el-menu-border-color': 'transparent',
  '--el-table-bg-color': 'transparent',
  '--el-table-tr-bg-color': 'transparent',
  '--el-table-header-bg-color': 'rgba(243, 246, 249, 0.92)',
  '--el-table-row-hover-bg-color': 'rgba(11, 138, 154, 0.05)',
  '--el-table-border-color': 'rgba(11, 138, 154, 0.12)',
  '--el-table-header-text-color': 'rgba(23, 32, 45, 0.72)',
  '--el-table-text-color': CUBE_COLORS.ink,
  '--el-card-bg-color': '#ffffff',
  '--el-dialog-bg-color': '#ffffff',

  '--wc-bg-color': '#f3f6f9',
  '--wc-bg-color-secondary': '#ffffff',
  '--wc-bg-color-tertiary': '#e8eef5',
  '--wc-text-color': CUBE_COLORS.ink,
  '--wc-text-color-secondary': 'rgba(23, 32, 45, 0.55)',
  '--wc-border-color': 'rgba(11, 138, 154, 0.22)',
  '--wc-border-color-lighter': 'rgba(11, 138, 154, 0.12)',
  '--wc-accent-cyan': '#0b8a9a',
  '--wc-glass-bg': 'rgba(255, 255, 255, 0.72)',
  '--wc-active-fill': 'rgba(11, 138, 154, 0.1)',

  '--app-shell-bg': [
    'radial-gradient(circle at 16% 18%, rgba(11, 138, 154, 0.1), transparent 26%)',
    'radial-gradient(circle at 78% 10%, rgba(154, 122, 62, 0.08), transparent 22%)',
    'linear-gradient(135deg, #f7fafc 0%, #eef3f7 56%, #f5f8fb 100%)',
  ].join(', '),
  '--app-shell-panel-bg': 'rgba(255, 255, 255, 0.92)',
  '--app-shell-panel-border': 'rgba(11, 138, 154, 0.16)',
  '--app-shell-panel-shadow': 'inset 0 0 0 1px rgba(11, 138, 154, 0.05)',
  '--app-shell-main-bg': 'rgba(255, 255, 255, 0.92)',
  '--app-shell-main-border': 'rgba(11, 138, 154, 0.16)',
  '--app-shell-main-shadow': 'inset 0 0 0 1px rgba(11, 138, 154, 0.05)',
  '--app-shell-divider': 'rgba(11, 138, 154, 0.12)',
  '--app-shell-setting-bg': 'transparent',
  '--app-shell-header-bg': 'rgba(255, 255, 255, 0.78)',
  '--app-shell-header-border': 'rgba(11, 138, 154, 0.12)',
  '--app-shell-content-bg': '#f3f6f9',

  '--logo-mark-border': 'rgba(11, 138, 154, 0.36)',
  '--logo-mark-bg': 'rgba(11, 138, 154, 0.06)',
  '--logo-mark-color': '#0b8a9a',
  '--logo-title-color': CUBE_COLORS.ink,
  '--menu-icon-border': 'rgba(11, 138, 154, 0.22)',
  '--menu-icon-bg': 'rgba(11, 138, 154, 0.06)',
  '--menu-icon-color': '#0b8a9a',
  '--menu-active-ring': 'rgba(11, 138, 154, 0.28)',
  '--header-icon-border': 'rgba(11, 138, 154, 0.28)',
  '--header-icon-bg': 'rgba(11, 138, 154, 0.06)',
  '--header-icon-color': '#0b8a9a',
  '--header-eyebrow-color': 'rgba(11, 138, 154, 0.85)',
  '--header-title-color': CUBE_COLORS.ink,
  '--header-meta-color': 'rgba(23, 32, 45, 0.55)',
  '--footer-avatar-border': 'rgba(11, 138, 154, 0.28)',
  '--footer-avatar-bg': 'rgba(11, 138, 154, 0.1)',
  '--footer-avatar-color': '#0b8a9a',
  '--footer-name-color': CUBE_COLORS.ink,
  '--footer-meta-color': 'rgba(23, 32, 45, 0.55)',
  '--footer-divider': 'rgba(11, 138, 154, 0.14)',

  '--type-title': CUBE_COLORS.ink,
  '--type-body': 'rgba(23, 32, 45, 0.82)',
  '--type-caption': 'rgba(23, 32, 45, 0.55)',
  '--type-eyebrow': 'rgba(11, 138, 154, 0.9)',
  '--workbench-bg': '#f3f6f9',
  '--workbench-hero-bg': [
    'radial-gradient(circle at 18% 20%, rgba(11, 138, 154, 0.1), transparent 42%)',
    'linear-gradient(135deg, #eef5f7 0%, #f7fafc 55%, #f3f6f9 100%)',
  ].join(', '),
  '--workbench-hero-border': 'rgba(11, 138, 154, 0.18)',
  '--workbench-hero-title': CUBE_COLORS.ink,
  '--workbench-hero-lead': CUBE_COLORS.inkSoft,
  '--workbench-hero-eyebrow': 'rgba(11, 138, 154, 0.9)',
  '--workbench-card-bg': 'rgba(255, 255, 255, 0.92)',
  '--workbench-card-border': 'rgba(11, 138, 154, 0.14)',
  '--workbench-card-title': CUBE_COLORS.ink,
  '--workbench-card-label': 'rgba(23, 32, 45, 0.72)',
  '--workbench-card-caption': 'rgba(23, 32, 45, 0.5)',
  '--workbench-soft-bg': 'rgba(243, 246, 249, 0.9)',
  '--workbench-soft-border': 'rgba(11, 138, 154, 0.12)',
  '--workbench-muted': 'rgba(23, 32, 45, 0.55)',
  '--workbench-hover-bg': 'rgba(11, 138, 154, 0.06)',
  '--workbench-hover-border': 'rgba(11, 138, 154, 0.32)',

  '--ds-accent-blue': '#0b8a9a',
  '--ds-accent-blue-rgb': '11, 138, 154',
  '--ds-border-card': 'rgba(11, 138, 154, 0.16)',
  '--ds-border-card-light': 'rgba(11, 138, 154, 0.12)',
  '--ds-border-card-muted': 'rgba(11, 138, 154, 0.08)',
  '--ds-shadow-card': 'none',
  '--ds-shadow-card-lg': 'none',
}

/* ---------- Classic：结构 ---------- */

const CLASSIC_CHROME_VARS: Record<string, string> = {
  '--cube-font-display': 'inherit',
  '--cube-font-mono': 'inherit',
  '--app-shell-radius': '16px',
  '--logo-mark-radius': '12px',
  '--logo-stamp-display': 'none',
  '--logo-svg-display': 'block',
  '--app-shell-shadow-recipe': 'drop',
}

/* ---------- Classic：浅色（对齐原 :root SaaS） ---------- */

const CLASSIC_LIGHT_VARS: Record<string, string> = {
  '--wc-active-fill': 'var(--el-color-primary-light-9)',
  '--wc-bg-color': '#ffffff',
  '--wc-bg-color-secondary': '#f5f7fa',
  '--wc-bg-color-tertiary': '#fafafa',
  '--wc-text-color': '#303133',
  '--wc-text-color-secondary': '#909399',
  '--wc-border-color': '#dcdfe6',
  '--wc-border-color-lighter': '#ebeef5',
  '--wc-accent-cyan': '#409eff',
  '--wc-glass-bg': 'rgba(255, 255, 255, 0.72)',

  '--ds-accent-blue': '#2563eb',
  '--ds-accent-blue-rgb': '37, 99, 235',
  '--ds-border-card': 'rgba(82, 124, 181, 0.16)',
  '--ds-border-card-light': 'rgba(82, 124, 181, 0.13)',
  '--ds-border-card-muted': 'rgba(82, 124, 181, 0.08)',
  '--ds-shadow-card': '0 12px 32px rgba(31, 58, 112, 0.08)',
  '--ds-shadow-card-lg': '0 18px 48px rgba(31, 58, 112, 0.08)',

  '--app-shell-bg': [
    'radial-gradient(circle at 12% 8%, rgba(37, 99, 235, 0.1), transparent 28%)',
    'linear-gradient(135deg, #f8fbff 0%, #edf4ff 48%, #f6fffb 100%)',
  ].join(', '),
  '--app-shell-panel-bg': 'linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(246, 251, 255, 0.9)), var(--el-bg-color)',
  '--app-shell-panel-border': 'rgba(82, 124, 181, 0.18)',
  '--app-shell-panel-shadow': '0 18px 48px rgba(31, 58, 112, 0.1)',
  '--app-shell-main-bg': 'rgba(255, 255, 255, 0.62)',
  '--app-shell-main-border': 'rgba(82, 124, 181, 0.16)',
  '--app-shell-main-shadow': '0 18px 48px rgba(31, 58, 112, 0.08)',
  '--app-shell-divider': 'rgba(82, 124, 181, 0.12)',
  '--app-shell-setting-bg': 'rgba(255, 255, 255, 0.42)',
  '--app-shell-header-bg': 'rgba(255, 255, 255, 0.82)',
  '--app-shell-header-border': 'rgba(82, 124, 181, 0.13)',
  '--app-shell-content-bg': 'linear-gradient(180deg, rgba(255, 255, 255, 0.4), transparent 220px), var(--el-bg-color-page)',

  '--logo-mark-border': 'rgba(37, 99, 235, 0.18)',
  '--logo-mark-bg': [
    'radial-gradient(circle at 30% 24%, rgba(45, 212, 191, 0.34), transparent 42%)',
    'linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(255, 255, 255, 0.84))',
  ].join(', '),
  '--logo-mark-color': 'var(--el-color-primary)',
  '--logo-title-color': '#14213d',
  '--menu-icon-border': 'rgba(64, 158, 255, 0.18)',
  '--menu-icon-bg': [
    'linear-gradient(180deg, rgba(64, 158, 255, 0.18), rgba(64, 158, 255, 0.08))',
    'linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.18))',
  ].join(', '),
  '--menu-icon-color': '#2d7ff9',
  '--menu-active-ring': 'rgba(47, 111, 237, 0.16)',
  '--header-icon-border': 'rgba(37, 99, 235, 0.16)',
  '--header-icon-bg': 'linear-gradient(180deg, rgba(37, 99, 235, 0.14), rgba(20, 184, 166, 0.08)), rgba(255, 255, 255, 0.78)',
  '--header-icon-color': 'var(--el-color-primary)',
  '--header-eyebrow-color': 'var(--el-text-color-secondary)',
  '--header-title-color': '#14213d',
  '--header-meta-color': 'var(--el-text-color-secondary)',
  '--footer-avatar-border': 'transparent',
  '--footer-avatar-bg': 'var(--el-color-primary-light-7)',
  '--footer-avatar-color': 'var(--el-color-primary)',
  '--footer-name-color': 'var(--el-text-color-primary)',
  '--footer-meta-color': 'var(--el-text-color-secondary)',
  '--footer-divider': 'var(--el-border-color-lighter)',

  '--type-title': '#14213d',
  '--type-body': '#303133',
  '--type-caption': '#909399',
  '--type-eyebrow': 'var(--el-text-color-secondary)',
  '--workbench-bg': 'var(--el-bg-color-page, #f7f8fa)',
  '--workbench-hero-bg': 'linear-gradient(115deg, #153c76, #2663b3 58%, #138f91)',
  '--workbench-hero-border': 'rgba(56, 103, 171, 0.16)',
  '--workbench-hero-title': '#ffffff',
  '--workbench-hero-lead': 'rgba(255, 255, 255, 0.85)',
  '--workbench-hero-eyebrow': 'rgba(255, 255, 255, 0.72)',
  '--workbench-card-bg': 'rgba(255, 255, 255, 0.88)',
  '--workbench-card-border': 'rgba(67, 106, 160, 0.14)',
  '--workbench-card-title': '#14213d',
  '--workbench-card-label': '#536681',
  '--workbench-card-caption': '#8290a6',
  '--workbench-soft-bg': '#f5f8fc',
  '--workbench-soft-border': 'rgba(67, 106, 160, 0.1)',
  '--workbench-shadow': '0 9px 24px rgba(42, 74, 122, 0.06)',
  '--workbench-muted': '#7c8ba0',
  '--workbench-hover-bg': 'rgba(37, 99, 235, 0.06)',
  '--workbench-hover-border': 'rgba(37, 99, 235, 0.28)',
}

/* ---------- Classic：暗色色值 ---------- */

const CLASSIC_DARK_VARS: Record<string, string> = {
  '--el-bg-color-page': '#0f1115',
  '--el-bg-color': '#1a1d24',
  '--el-bg-color-overlay': '#242830',
  '--el-text-color-primary': '#e5eaf3',
  '--el-text-color-regular': '#cfd3dc',
  '--el-text-color-secondary': '#a3a6ad',
  '--el-form-label-color': '#cfd3dc',
  '--el-text-color-placeholder': '#8d9095',
  '--el-text-color-disabled': '#6c6e72',
  '--el-border-color': '#4c4d4f',
  '--el-border-color-light': '#414243',
  '--el-border-color-lighter': '#363637',
  '--el-border-color-extra-light': '#2b2b2c',
  '--el-border-color-dark': '#58585b',
  '--el-fill-color': '#2b2b2c',
  '--el-fill-color-light': '#262727',
  '--el-fill-color-lighter': '#1d1d1d',
  '--el-fill-color-extra-light': '#191919',
  '--el-fill-color-blank': 'transparent',
  '--el-mask-color': 'rgba(0, 0, 0, 0.8)',
  '--el-mask-color-extra-light': 'rgba(0, 0, 0, 0.3)',
  '--el-disabled-bg-color': '#2b2b2c',
  '--el-disabled-text-color': '#6c6e72',
  '--el-disabled-border-color': '#4c4d4f',
  '--el-overlay-color': 'rgba(0, 0, 0, 0.8)',
  '--el-overlay-color-light': 'rgba(0, 0, 0, 0.7)',
  '--el-overlay-color-lighter': 'rgba(0, 0, 0, 0.5)',
  '--el-menu-bg-color': 'transparent',
  '--el-menu-text-color': '#cfd3dc',
  '--el-menu-hover-bg-color': '#262727',
  '--el-menu-hover-text-color': '#e5eaf3',
  '--el-menu-active-color': 'var(--el-color-primary)',
  '--el-menu-border-color': 'transparent',
  '--el-table-bg-color': 'transparent',
  '--el-table-tr-bg-color': 'transparent',
  '--el-table-header-bg-color': '#1d1d1d',
  '--el-table-row-hover-bg-color': '#262727',
  '--el-table-border-color': '#363637',
  '--el-table-header-text-color': '#a3a6ad',
  '--el-table-text-color': '#e5eaf3',
  '--el-card-bg-color': '#1a1d24',
  '--el-dialog-bg-color': '#1a1d24',

  '--wc-bg-color': '#0f1115',
  '--wc-bg-color-secondary': '#1a1d24',
  '--wc-bg-color-tertiary': '#242830',
  '--wc-text-color': '#e5eaf3',
  '--wc-text-color-secondary': '#a3a6ad',
  '--wc-border-color': '#4c4d4f',
  '--wc-border-color-lighter': '#363637',
  '--wc-accent-cyan': '#409eff',
  '--wc-glass-bg': 'rgba(26, 29, 36, 0.72)',
  '--wc-active-fill': 'var(--el-color-primary-light-9)',

  '--app-shell-bg': [
    'radial-gradient(circle at 12% 8%, rgba(37, 99, 235, 0.16), transparent 28%)',
    'linear-gradient(135deg, #10131a 0%, #151a24 48%, #12161e 100%)',
  ].join(', '),
  '--app-shell-panel-bg': 'linear-gradient(180deg, rgba(32, 36, 46, 0.96), rgba(22, 25, 32, 0.94))',
  '--app-shell-panel-border': 'rgba(100, 130, 180, 0.22)',
  '--app-shell-panel-shadow': '0 18px 48px rgba(0, 0, 0, 0.35)',
  '--app-shell-main-bg': 'rgba(26, 29, 36, 0.72)',
  '--app-shell-main-border': 'rgba(100, 130, 180, 0.18)',
  '--app-shell-main-shadow': '0 18px 48px rgba(0, 0, 0, 0.28)',
  '--app-shell-divider': 'rgba(100, 130, 180, 0.14)',
  '--app-shell-setting-bg': 'rgba(20, 22, 28, 0.55)',
  '--app-shell-header-bg': 'rgba(26, 29, 36, 0.88)',
  '--app-shell-header-border': 'rgba(100, 130, 180, 0.14)',
  '--app-shell-content-bg': '#0f1115',

  '--logo-mark-border': 'rgba(64, 158, 255, 0.28)',
  '--logo-mark-bg': 'linear-gradient(135deg, rgba(64, 158, 255, 0.22), rgba(255, 255, 255, 0.06))',
  '--logo-mark-color': 'var(--el-color-primary)',
  '--logo-title-color': '#e5eaf3',
  '--menu-icon-border': 'rgba(64, 158, 255, 0.22)',
  '--menu-icon-bg': 'rgba(64, 158, 255, 0.12)',
  '--menu-icon-color': '#66b1ff',
  '--menu-active-ring': 'rgba(64, 158, 255, 0.28)',
  '--header-icon-border': 'rgba(64, 158, 255, 0.22)',
  '--header-icon-bg': 'rgba(64, 158, 255, 0.1)',
  '--header-icon-color': 'var(--el-color-primary)',
  '--header-eyebrow-color': '#a3a6ad',
  '--header-title-color': '#e5eaf3',
  '--header-meta-color': '#a3a6ad',
  '--footer-avatar-border': 'transparent',
  '--footer-avatar-bg': 'var(--el-color-primary-light-7)',
  '--footer-avatar-color': 'var(--el-color-primary)',
  '--footer-name-color': '#e5eaf3',
  '--footer-meta-color': '#a3a6ad',
  '--footer-divider': '#363637',

  '--type-title': '#e5eaf3',
  '--type-body': '#cfd3dc',
  '--type-caption': '#a3a6ad',
  '--type-eyebrow': '#a3a6ad',
  '--workbench-bg': '#0f1115',
  '--workbench-hero-bg': 'linear-gradient(115deg, #153c76, #2663b3 58%, #138f91)',
  '--workbench-hero-border': 'rgba(56, 103, 171, 0.28)',
  '--workbench-hero-title': '#ffffff',
  '--workbench-hero-lead': 'rgba(255, 255, 255, 0.85)',
  '--workbench-hero-eyebrow': 'rgba(255, 255, 255, 0.72)',
  '--workbench-card-bg': 'rgba(26, 29, 36, 0.92)',
  '--workbench-card-border': 'rgba(100, 130, 180, 0.18)',
  '--workbench-card-title': '#e5eaf3',
  '--workbench-card-label': '#cfd3dc',
  '--workbench-card-caption': '#a3a6ad',
  '--workbench-soft-bg': 'rgba(36, 40, 48, 0.72)',
  '--workbench-soft-border': 'rgba(100, 130, 180, 0.12)',
  '--workbench-shadow': '0 9px 24px rgba(0, 0, 0, 0.28)',
  '--workbench-muted': '#a3a6ad',
  '--workbench-hover-bg': 'rgba(64, 158, 255, 0.1)',
  '--workbench-hover-border': 'rgba(64, 158, 255, 0.36)',
}

export const APPEARANCE_STYLES: AppearanceStyle[] = [
  {
    id: 'cube',
    label: 'Cube · 信号青',
    description: '细线面板 + WC stamp + Georgia/Consolas；浅/深只换色值',
    colors: [CUBE_COLORS.bg0, CUBE_COLORS.bg1, CUBE_COLORS.signal, CUBE_COLORS.brass, CUBE_COLORS.text],
    chromeVars: CUBE_CHROME_VARS,
    lightVars: CUBE_LIGHT_SHELL,
    darkVars: {
      ...CUBE_EP_CSS_VARS,
      ...CUBE_WC_CSS_VARS,
      ...CUBE_DARK_SHELL,
    },
    primaryMixTarget: CUBE_COLORS.bg0,
    recommended: {
      presetId: 'breeze',
      mode: 'dark',
      size: 'default',
      borderRadius: 4,
    },
  },
  {
    id: 'classic',
    label: '经典 · SaaS',
    description: '圆角玻璃侧栏 + 系统字体；浅/深只换色值',
    colors: ['#0f1115', '#1a1d24', '#409EFF', '#2663b3', '#e5eaf3'],
    chromeVars: CLASSIC_CHROME_VARS,
    lightVars: CLASSIC_LIGHT_VARS,
    darkVars: CLASSIC_DARK_VARS,
    primaryMixTarget: '#141414',
    recommended: {
      presetId: 'welldesign',
      mode: 'light',
      size: 'default',
      borderRadius: 6,
    },
  },
]

export const DEFAULT_APPEARANCE: AppearanceStyleId = 'cube'

export function findAppearance(id: string | undefined | null): AppearanceStyle {
  return APPEARANCE_STYLES.find(s => s.id === id) ?? APPEARANCE_STYLES[0]
}

export function normalizeAppearance(id: unknown): AppearanceStyleId {
  if (id === 'cube' || id === 'classic')
    return id
  return DEFAULT_APPEARANCE
}

/** 切换风格/明暗时需清理的内联变量（chrome + 浅/深色并集） */
export const APPEARANCE_INLINE_VAR_KEYS: string[] = Array.from(
  new Set(
    APPEARANCE_STYLES.flatMap(s => [
      ...Object.keys(s.chromeVars),
      ...Object.keys(s.lightVars),
      ...Object.keys(s.darkVars),
    ]),
  ),
)
