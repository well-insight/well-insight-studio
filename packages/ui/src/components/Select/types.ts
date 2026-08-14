import type { WdAppendTo } from '../../shared/overlay'
import type { WdSizeInput } from '../../shared/types'

export type SelectValue = string | number
export type SelectSize = WdSizeInput

export interface SelectOption {
  label: string
  value: SelectValue
  disabled?: boolean
}

export interface SelectProps {
  modelValue?: SelectValue | undefined
  options: SelectOption[]
  label?: string
  helpText?: string
  /** @deprecated Prefer `invalid`. */
  error?: boolean
  invalid?: boolean
  id?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  size?: SelectSize
  fluid?: boolean
  /** Teleport overlay. Defaults to `true`. */
  teleport?: boolean
  /** Mount target. Defaults to `'body'`. */
  appendTo?: WdAppendTo
  placement?: 'bottom-start' | 'bottom-end'
}

export interface SelectEmits {
  (event: 'update:modelValue', value: SelectValue | undefined): void
  (event: 'change', value: SelectValue | undefined): void
  (event: 'show'): void
  (event: 'hide'): void
}
