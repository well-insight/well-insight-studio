/**
 * Cube / LoginCube 共享色板。
 * 暗色主题与壳层变量以本文件为源；组件用 var(--cube-*) / var(--app-shell-*)，
 * 禁止依赖 scoped 内 :global(html.dark) 覆盖背景（会被 data-v 浅色规则压过）。
 */

export const CUBE_COLORS = {
  bg0: '#0c1016',
  bg1: '#121923',
  bg2: '#1a2433',
  text: '#eaf2ff',
  textMuted: 'rgba(234, 242, 255, 0.72)',
  textSoft: 'rgba(234, 242, 255, 0.55)',
  signal: '#7cf2ff',
  brass: '#c9a76a',
  panel: '#f3efe4',
  ink: '#17202d',
  inkSoft: 'rgba(23, 32, 45, 0.62)',
} as const

export const CUBE_FONTS = {
  display: `'Georgia', 'Times New Roman', serif`,
  mono: `'Consolas', 'SFMono-Regular', 'Menlo', monospace`,
} as const

/** 注入 html 的 Cube 语义变量 */
export const CUBE_ROOT_CSS_VARS: Record<string, string> = {
  '--cube-bg-0': CUBE_COLORS.bg0,
  '--cube-bg-1': CUBE_COLORS.bg1,
  '--cube-bg-2': CUBE_COLORS.bg2,
  '--cube-text': CUBE_COLORS.text,
  '--cube-text-muted': CUBE_COLORS.textMuted,
  '--cube-text-soft': CUBE_COLORS.textSoft,
  '--cube-signal': CUBE_COLORS.signal,
  '--cube-brass': CUBE_COLORS.brass,
  '--cube-panel': CUBE_COLORS.panel,
  '--cube-ink': CUBE_COLORS.ink,
  '--cube-ink-soft': CUBE_COLORS.inkSoft,
  '--cube-border': 'rgba(124, 242, 255, 0.14)',
  '--cube-border-strong': 'rgba(124, 242, 255, 0.28)',
  '--cube-fill': 'rgba(124, 242, 255, 0.08)',
}

/** 暗色 app-shell（覆盖 :root 浅色默认） */
export const CUBE_APP_SHELL_CSS_VARS: Record<string, string> = {
  '--app-shell-bg': [
    'radial-gradient(circle at 16% 18%, rgba(124, 242, 255, 0.14), transparent 24%)',
    'radial-gradient(circle at 78% 10%, rgba(201, 167, 106, 0.09), transparent 20%)',
    'linear-gradient(135deg, #0c1016 0%, #121923 56%, #0f1824 100%)',
  ].join(', '),
  '--app-shell-panel-bg': 'rgba(14, 20, 30, 0.92)',
  '--app-shell-panel-border': 'rgba(124, 242, 255, 0.12)',
  '--app-shell-panel-shadow': 'inset 0 0 0 1px rgba(124, 242, 255, 0.04)',
  '--app-shell-main-bg': 'rgba(14, 20, 30, 0.92)',
  '--app-shell-main-border': 'rgba(124, 242, 255, 0.12)',
  '--app-shell-main-shadow': 'inset 0 0 0 1px rgba(124, 242, 255, 0.04)',
  '--app-shell-divider': 'rgba(124, 242, 255, 0.1)',
  '--app-shell-setting-bg': 'transparent',
  '--app-shell-header-bg': 'rgba(8, 12, 18, 0.65)',
  '--app-shell-header-border': 'rgba(124, 242, 255, 0.1)',
  '--app-shell-content-bg': '#0c1016',
}

/** 暗色 Element Plus */
export const CUBE_EP_CSS_VARS: Record<string, string> = {
  '--el-bg-color-page': CUBE_COLORS.bg0,
  '--el-bg-color': CUBE_COLORS.bg1,
  '--el-bg-color-overlay': CUBE_COLORS.bg2,
  '--el-text-color-primary': CUBE_COLORS.text,
  '--el-text-color-regular': 'rgba(234, 242, 255, 0.82)',
  '--el-text-color-secondary': CUBE_COLORS.textSoft,
  '--el-text-color-placeholder': 'rgba(234, 242, 255, 0.4)',
  '--el-text-color-disabled': 'rgba(234, 242, 255, 0.32)',
  '--el-border-color': 'rgba(124, 242, 255, 0.2)',
  '--el-border-color-light': 'rgba(124, 242, 255, 0.14)',
  '--el-border-color-lighter': 'rgba(124, 242, 255, 0.1)',
  '--el-border-color-extra-light': 'rgba(124, 242, 255, 0.07)',
  '--el-border-color-dark': 'rgba(124, 242, 255, 0.3)',
  '--el-fill-color': 'rgba(14, 20, 30, 0.72)',
  '--el-fill-color-light': 'rgba(26, 36, 51, 0.72)',
  '--el-fill-color-lighter': 'rgba(26, 36, 51, 0.45)',
  '--el-fill-color-extra-light': 'rgba(26, 36, 51, 0.28)',
  '--el-fill-color-blank': 'transparent',
  '--el-mask-color': 'rgba(4, 8, 14, 0.72)',
  '--el-mask-color-extra-light': 'rgba(4, 8, 14, 0.4)',
  '--el-disabled-bg-color': 'rgba(14, 20, 30, 0.45)',
  '--el-disabled-text-color': 'rgba(234, 242, 255, 0.32)',
  '--el-disabled-border-color': 'rgba(124, 242, 255, 0.12)',
  '--el-overlay-color': 'rgba(4, 8, 14, 0.8)',
  '--el-overlay-color-light': 'rgba(4, 8, 14, 0.65)',
  '--el-overlay-color-lighter': 'rgba(4, 8, 14, 0.45)',
  '--el-box-shadow': '0 12px 32px rgba(4, 8, 14, 0.5)',
  '--el-box-shadow-light': '0 0 12px rgba(4, 8, 14, 0.35)',
  '--el-box-shadow-lighter': '0 0 6px rgba(4, 8, 14, 0.28)',
  '--el-box-shadow-dark':
    '0 16px 48px 16px rgba(4, 8, 14, 0.4), 0 12px 32px rgba(4, 8, 14, 0.35)',

  '--el-menu-bg-color': 'transparent',
  '--el-menu-text-color': 'rgba(234, 242, 255, 0.78)',
  '--el-menu-hover-bg-color': 'rgba(124, 242, 255, 0.08)',
  '--el-menu-hover-text-color': CUBE_COLORS.text,
  '--el-menu-active-color': CUBE_COLORS.signal,
  '--el-menu-border-color': 'transparent',

  '--el-table-bg-color': 'transparent',
  '--el-table-tr-bg-color': 'transparent',
  '--el-table-header-bg-color': 'rgba(14, 20, 30, 0.72)',
  '--el-table-row-hover-bg-color': 'rgba(124, 242, 255, 0.08)',
  '--el-table-border-color': 'rgba(124, 242, 255, 0.12)',
  '--el-table-header-text-color': 'rgba(234, 242, 255, 0.78)',
  '--el-table-text-color': CUBE_COLORS.text,
  '--el-table-fixed-box-shadow': '0 0 10px rgba(4, 8, 14, 0.45)',

  '--el-card-bg-color': CUBE_COLORS.bg1,
  '--el-dialog-bg-color': CUBE_COLORS.bg1,
  '--el-popup-modal-bg-color': 'rgba(4, 8, 14, 0.72)',

  '--el-input-bg-color': 'rgba(14, 20, 30, 0.55)',
  '--el-input-border-color': 'rgba(124, 242, 255, 0.2)',
  '--el-input-hover-border-color': 'rgba(124, 242, 255, 0.4)',
  '--el-input-focus-border-color': CUBE_COLORS.signal,
  '--el-button-bg-color': 'rgba(26, 36, 51, 0.72)',
  '--el-button-border-color': 'rgba(124, 242, 255, 0.22)',
  '--el-button-text-color': CUBE_COLORS.text,
  '--el-button-hover-text-color': '#ffffff',
  '--el-button-hover-bg-color': 'rgba(124, 242, 255, 0.14)',
  '--el-button-hover-border-color': 'rgba(124, 242, 255, 0.4)',
  '--el-button-active-bg-color': 'rgba(124, 242, 255, 0.2)',
  '--el-button-active-border-color': 'rgba(124, 242, 255, 0.5)',

  '--el-tabs-header-bg-color': 'transparent',
}

export const CUBE_WC_CSS_VARS: Record<string, string> = {
  '--wc-bg-color': CUBE_COLORS.bg0,
  '--wc-bg-color-secondary': CUBE_COLORS.bg1,
  '--wc-bg-color-tertiary': CUBE_COLORS.bg2,
  '--wc-text-color': CUBE_COLORS.text,
  '--wc-text-color-secondary': CUBE_COLORS.textSoft,
  '--wc-border-color': 'rgba(124, 242, 255, 0.2)',
  '--wc-border-color-lighter': 'rgba(124, 242, 255, 0.12)',
  '--wc-accent-cyan': CUBE_COLORS.signal,
  '--wc-glass-bg': 'rgba(12, 16, 22, 0.55)',
  '--wc-active-fill': 'rgba(124, 242, 255, 0.12)',
}
