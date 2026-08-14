import type { WdInputVariant, WdSizeInput } from '../../shared/types'

export interface InputProps {
  modelValue?: string
  label?: string
  helpText?: string
  /** Prefer over `error`. Marks the field invalid. */
  invalid?: boolean
  /** @deprecated Prefer `invalid`. */
  error?: boolean
  id?: string
  type?: 'text' | 'email' | 'password' | 'search' | 'url' | 'tel'
  /** Size aligned with PrimeVue InputText; also accepts legacy sm/md/lg. */
  size?: WdSizeInput
  /** Visual variant; default outlined. */
  variant?: WdInputVariant
  /** Full-width input. */
  fluid?: boolean
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
}

export interface InputEmits {
  (event: 'update:modelValue', value: string): void
  (event: 'clear'): void
}

export interface InputInstance {
  focus: () => void
}
