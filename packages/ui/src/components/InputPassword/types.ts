import type { WdSizeInput } from '../../shared/types'

export interface InputPasswordProps {
  modelValue?: string
  label?: string
  disabled?: boolean
  invalid?: boolean
  fluid?: boolean
  size?: WdSizeInput
  /** Show password strength hint. */
  feedback?: boolean
  /** Show toggle mask button. */
  toggleMask?: boolean
  id?: string
}

export interface InputPasswordEmits {
  (event: 'update:modelValue', value: string): void
}

export type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong'
