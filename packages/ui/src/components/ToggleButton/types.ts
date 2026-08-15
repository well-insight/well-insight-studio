export interface ToggleButtonProps {
  modelValue?: boolean
  onLabel?: string
  offLabel?: string
  onIcon?: string
  offIcon?: string
  disabled?: boolean
}

export interface ToggleButtonEmits {
  (event: 'update:modelValue', value: boolean): void
}
