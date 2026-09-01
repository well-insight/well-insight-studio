const WIDGET_COLOR_TOKENS = [
  '--wi-color-primary',
  '--wi-color-help',
  '--wi-color-warning',
  '--wi-color-success',
  '--wi-color-danger',
  '--wi-color-info',
] as const

export function readCssColor(token: string): string {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim()
}

export function getWidgetColorPalette(): string[] {
  const colors = WIDGET_COLOR_TOKENS.map(readCssColor).filter(Boolean)
  return colors.length > 0 ? colors : [readCssColor('--wi-color-primary')]
}

export function getExportBackgroundColor(): string | null {
  return readCssColor('--wi-color-surface') || null
}
