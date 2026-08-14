import type { WdAppendTo } from '../../shared/overlay'

export type DialogPosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'topleft'
  | 'topright'
  | 'bottomleft'
  | 'bottomright'

export interface DialogProps {
  /** Visibility. Use with `v-model` (PrimeVue uses `visible`; Well Design keeps `modelValue`). */
  modelValue?: boolean
  /** Dialog title text. Alias of PrimeVue `header`. */
  title?: string
  /** PrimeVue-aligned alias for `title`. */
  header?: string
  closeOnEsc?: boolean
  /** Close when clicking the mask. Alias of PrimeVue `dismissableMask`. */
  closeOnOutsideClick?: boolean
  /** PrimeVue-aligned alias for `closeOnOutsideClick`. */
  dismissableMask?: boolean
  closable?: boolean
  modal?: boolean
  position?: DialogPosition
  width?: string
  /** Teleport overlay. Defaults to `true`. */
  teleport?: boolean
  /** Mount target. Defaults to `'body'`. */
  appendTo?: WdAppendTo
}

export interface DialogEmits {
  (event: 'update:modelValue', value: boolean): void
  (event: 'close'): void
  (event: 'show'): void
  (event: 'hide'): void
}
