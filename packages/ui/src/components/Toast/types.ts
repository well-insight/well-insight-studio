import type { WdAppendTo } from '../../shared/overlay'
import type { WdToastSeverity } from '../../shared/types'

/** toast severities; `warning` kept as legacy alias for `warn`. */
export type ToastSeverity = WdToastSeverity | 'warning'

export interface ToastMessage {
  id: string | number
  summary: string
  detail?: string
  severity?: ToastSeverity
  closable?: boolean
}

export interface ToastProps {
  messages?: ToastMessage[]
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  /** Teleport overlay. Defaults to `true`. */
  teleport?: boolean
  /** Mount target. Defaults to `'body'`. */
  appendTo?: WdAppendTo
}

export interface ToastEmits {
  (event: 'close', message: ToastMessage): void
}
