import type { WdToastSeverity } from '../../shared/types'

/** Alert severities; `warning` maps to `warn`; includes `help`. */
export type AlertSeverity = WdToastSeverity | 'warning' | 'help'

export type AlertEffect = 'light' | 'dark'

export interface AlertProps {
  /** Bold title line. */
  title?: string
  /** Description; default slot overrides when both present. */
  description?: string
  /**
   * Semantic tone. Default `info`.
   * Legacy `warning` is normalized to `warn`.
   */
  severity?: AlertSeverity
  /** Show close button. */
  closable?: boolean
  /** Show severity icon. Defaults to `true`. */
  showIcon?: boolean
  /** `light` soft fill; `dark` solid severity background. */
  effect?: AlertEffect
}

export interface AlertEmits {
  (event: 'close'): void
}
