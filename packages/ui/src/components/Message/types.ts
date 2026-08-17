import type { WdToastSeverity } from '../../shared/types'

/** message severities; `warning` kept as legacy alias for `warn`. */
export type MessageSeverity = WdToastSeverity | 'warning'

export interface MessageProps {
  /**
   * Semantic tone. Default `info`.
   * Legacy `warning` is normalized to `warn`.
   */
  severity?: MessageSeverity
  /** Show close button. */
  closable?: boolean
  /** Auto-close delay in ms. Omit to keep open. */
  life?: number
  /** Show severity icon. Defaults to `true`. */
  icon?: boolean
}

export interface MessageEmits {
  (event: 'close'): void
}
