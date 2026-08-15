import type { WdAppendTo } from '../../shared/overlay'

export interface AutoCompleteProps {
  modelValue?: string
  suggestions?: string[]
  dropdown?: boolean
  disabled?: boolean
  placeholder?: string
  /** Teleport overlay. Defaults to `true`. */
  teleport?: boolean
  /** Teleport target. Defaults to `'body'` (or ConfigProvider `appendTo`). */
  appendTo?: WdAppendTo
}

export interface AutoCompleteEmits {
  (event: 'update:modelValue', value: string): void
  (event: 'complete', query: string): void
}
