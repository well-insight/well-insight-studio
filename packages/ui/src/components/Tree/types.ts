export interface TreeNode {
  key: string
  label: string
  children?: TreeNode[]
  icon?: string
}

export type TreeSelectionKeys = Record<string, boolean>
export type TreeSelectionMode = 'single' | 'multiple'

export interface TreeProps {
  value: TreeNode[]
  selectionKeys?: TreeSelectionKeys
  /** Single-select convenience; prefer `selectionKeys` for multiple. */
  modelValue?: string | null
  selectionMode?: TreeSelectionMode
}

export interface TreeEmits {
  (event: 'update:selectionKeys', value: TreeSelectionKeys): void
  (event: 'update:modelValue', value: string | null): void
}
