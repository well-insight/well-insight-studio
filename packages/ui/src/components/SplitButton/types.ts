import type { ButtonSeverity, ButtonSize } from '../Button/types'

export interface SplitButtonItem {
  label: string
  command?: () => void
  disabled?: boolean
}

export interface SplitButtonProps {
  label?: string
  icon?: string
  model?: SplitButtonItem[]
  severity?: ButtonSeverity
  disabled?: boolean
  outlined?: boolean
  size?: ButtonSize | 'sm' | 'md' | 'lg'
}

export interface SplitButtonEmits {
  (event: 'click', value: MouseEvent): void
  (event: 'command', item: SplitButtonItem): void
}
